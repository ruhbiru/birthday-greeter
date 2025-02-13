import { hrtime } from "node:process";
import {
  ConsoleLogger,
  Inject,
  Injectable,
  LoggerService,
} from "@nestjs/common";
import type { LogLevel } from "@nestjs/common";
import * as _ from "lodash";
import { WinstonLogger, WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { BaseControl } from "../base/base.control";

/**
 * Custom application logger.
 *
 * Extends Nest's Logger by adding few extra mehtods that migth come in handy (e.g., `time` to log around and time the duration of an
 * asynchronous operation).
 *
 * Note: Logger does not do the logging by itself; it delegates that to `this.localInstanceRef`, which by default is an instance of
 * ConsoleLogger but can be overriden at run-time using the static method `overrideLogger` which Nest will all as a result of invoking
 * `app.useLogger...`.  This design allows you to create loggers simply via `new Logger`, and have their actual implementation getting
 * swapped out, at run-time; this comes in quite handy when your actual logger uses dependency injection given that you would need to worry
 * about that only once, when overriding the logger in your main, while everything else stays _simple_ (i.e., `new Logger`):
 *
 * - Everywhere you need a logger you would simply run: `new Logger("some context")`
 * - Once in your main file you would do: `app.useLogger(app.get(TypeOfALoggerThatUsesDependencyInjection))`
 *
 * Again, CnLogger extends Logger, so it's expected you instantiate it like: `new CnLogger(context?)`, and not via dependency injection.
 *
 * For the implementation of the actual logger, see CnInternalLogger.
 *
 */
export class LsLogger extends ConsoleLogger {
  /**
   * Logs around and measure the run-time duration of `k`.  Returns whichever `k` returns.
   *
   * Calling the method will immediately result in an "info" event getting emitted, having `${label} start` as message; then `k` is
   * executed, and when it completes, andother "info" event is emitted with `${label} end` as message, and with a `deltaMs` prop added to
   * the context, containing the amount of milliseconds elapsed since the start and end traces.
   *
   * Highly inspired by the pair `console.time` / `console.timeEnd`, this method differs from the standard by forcing the caller
   * to pass in a thunk / continuation which is going to be timed.
   *
   * This has a couple of interesting side effects:
   *
   * 1. It makes it quite trivial to support nesting -- currently, nesting `console.time` calls with the same tag is not supported and will
   *    result in run-time warnings
   * 2. It makes it quite trivial to time around asynchronous operations.  For example, let's say you have the following expression you want
   *    to time:
   *
   *        const searchModels = await this.mapToSearchModel(data);
   *
   *    You can time the call to `mapToSearchModel` as simply as:
   *
   *        const searchModels = await this.logger.time(`mapToSearchModel`, () => this.mapToSearchModel(data));
   */
  async time<M>(
    label: string,
    k: () => M | Promise<M>,
    context?: Record<string, any>
  ): Promise<M> {
    let caughtError = null;
    const start = hrtime.bigint();
    this.log(`${label} start`, context);
    try {
      // we `await` here because we want to log when the continuation has finished running; if we did not `await` here, the elapsed time
      // would take into account the time it takes to create the promise, and not wait for it to be fulfilled / rejected.
      return await k();
    } catch (error) {
      caughtError = error;
      throw caughtError;
    } finally {
      const end = hrtime.bigint();
      const deltaNs = end - start;
      const args = {
        message: `${label} end`,
        context: { ...context, deltaMs: deltaNs / BigInt("1000000") } as Record<
          string,
          any
        >,
      };
      if (caughtError) {
        args.message += ` with error`;
        args.context.caughtError = CnInternalLogger.errorToPojo(caughtError);
      }

      this.log(args.message, args.context);
    }
  }
}

/**
 * This decorator wraps a method of a class extending BaseControl with automatic logging functionality.
 * It logs the execution time of the decorated method using the `logger` instance from BaseControl.
 *
 * `label` can be used to customize the message getting logged; if not specified, the name of the decorated method will be used instead.
 *
 * Usage:
 * 1. Without custom label: @LoggedAround()
 * 2. With custom label: @LoggedAround('Custom timing label')
 */
export function LoggedAround(label?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (this: BaseControl, ...args: any[]) {
      const timeLabel = label || propertyKey;
      return this.logger.time(timeLabel, () =>
        originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}

/**
 * Custom logger, based off Winston, which enriches each emitted message with information (e.g., current requestId, or sessionId) pulled
 * from the curent execution context.
 *
 * It also tries to work-around the fact that Nest's Logger interface allows you to pass pretty much anything into the logger, which makes
 * it a bit hard to get sane log traces, especially around errors.
 *
 * CnInternalLogger is an Injectable and is expected to be used in tandem with `app.useLogger(app.get(CnInternalLogger))`; if you need to
 * instantiate a logger in one of your services or controllers, use CnLogger instead.
 */
@Injectable()
export class CnInternalLogger implements LoggerService {
  @Inject(WINSTON_MODULE_NEST_PROVIDER) protected logger: WinstonLogger;

  verbose(message: any, ...optionalParams: any[]) {
    this.call("verbose", message, ...optionalParams);
  }

  debug(message: any, ...optionalParams: any[]) {
    this.call("debug", message, ...optionalParams);
  }

  log(message: any, ...optionalParams: any[]) {
    this.call("log", message, ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    this.call("warn", message, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    this.call("error", message, ...optionalParams);
  }

  private call(level: LogLevel, message: any, ...optionalParams: any[]) {
    const objArg = {};
    let context;

    // Nest.js Logger's interface is just unbelieavable:
    //
    // - it allows `message` to be a string, an Error, or an object
    // - it allows users to pass in multiple objects and have each of
    //   them logged on it's own line
    // - a context, if one exists, will be passed as the last argument
    //
    // I cannot imagine why they would want to do that -- i guess it
    // has something to do the app framework trying to stay open to support
    // as many logging frameworks as possible.
    //
    // Anyways, this makes intercepting logging operations ridicolously
    // difficult to implement, but it is what it is...

    // If a context exists, it will be found as last optional argument
    // Note: it's also possible to create a logger without a context, which means
    // we need to type-case the last argument: (1) if string, then it's our context;
    // (2) if not a string, then we should not try to use that object as our context
    // (e.g. `logger.error("Ooooops", new Error());`)
    //
    //     new Logger().log("No context");
    //     new Logger().log("Explicit context", "context");
    //     new Logger("context").log("Implicit context");
    //     new Logger().error("Error with no context", new Error());
    //     new Logger().error("Error with explicit context", new Error(), "context");
    //     new Logger("context").error("Error with implicit context", new Error());
    let params = optionalParams;
    if (
      optionalParams.length !== 0 &&
      typeof optionalParams[optionalParams.length - 1] == "string"
    ) {
      context = optionalParams[optionalParams.length - 1];
      params = optionalParams.slice(0, -1);
    }

    // We don't want to support logging multiple lines with a single log call!
    //
    // Most (if not all) our logger-related invocations would look like:
    //
    // - logger.log('string message');
    // - logger.log('string message', ctx);
    if (params.length > 1) {
      const error = new Error(
        "Logger method called with too many arguments"
      ) as any;
      error.logLevel = level;
      error.logMessage = message;
      error.context = context;
      error.params = params;
      console.error(error);
      return;
    }

    if (level !== "error") {
      let error;
      objArg["message"] = message;
      if (params[0] instanceof Error) {
        // Standard CNXT warn invocation: `logger.warn('message', err)`
        // we save the error name/message, and extract its stack
        error = params[0];
      } else if (typeof params[0] === "object") {
        // Semi-standard CNXT warn invocation: `logger.warn('message', ctx)`
        // We spread the additional param into the context, and then:
        // if `error`, `err`, or `up` is there, insie params, then we
        // assume it's an error object, and use that.
        Object.assign(objArg, params[0]);
        error = this.pullOutError(objArg);
      }
      if (error) {
        objArg["error"] = CnInternalLogger.errorToPojo(error);
        objArg["stack"] = error.stack;
      }
      this.logger[level](objArg, context);
    } else {
      let error;
      if (message instanceof Error) {
        // Nest.js might call `logger.error` and pass an exception
        // as it's first argument.
        // We save its name/message, and extract its stack
        error = message;
        objArg["message"] = error.message ?? error.name;
      } else {
        objArg["message"] = message;
        if (params[0] instanceof Error) {
          // Standard CNXT invocation: `logger.error('message', err)`
          // we save the error name/message, and extract its stack
          error = params[0];
        } else if (typeof params[0] === "object") {
          // Semi-standard CNXT invocation: `logger.error('message', ctx)`
          // We spread the additional param into the context, and then:
          // if `error`, `err`, or `up` is there, insie params, then we
          // assume it's an error object, and use that.  Otherwise, since
          // we don't have a stack trace, we create a synthetic Error
          // and use its stack instead (it will result in few
          // additional frames, but good enough for now)
          Object.assign(objArg, params[0]);
          error = this.pullOutError(objArg) ?? new Error(objArg["message"]);
        } else {
          // Here we cater for the standard invocation: `logger.error('message', 'stack')`
          error = new Error(objArg["message"]);
          error.stack = params[0] ?? error.stack;
        }
      }
      objArg["error"] = CnInternalLogger.errorToPojo(error);
      this.logger[level](objArg, error.stack, context);
    }
  }

  private pullOutError(context: any) {
    for (const prop of ["error", "err", "up"]) {
      if (context[prop]) {
        const error = context[prop];
        delete context[prop];
        return error;
      }
    }
  }

  static errorToPojo(error: Error) {
    const pojo = {};
    for (const prop of Object.getOwnPropertyNames(error)) {
      if (prop !== "stack") {
        pojo[prop] = error[prop];
      }
    }
    return pojo;
  }
}

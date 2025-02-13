import * as _ from 'lodash';

export function MapObject<T>(data: any, newTarget: new () => T): T {
  if (_.isEmpty(data)) {
    return data;
  }

  const target = new newTarget();
  _.forEach(Object.keys(target), function (key) {
    if (_.has(data, key)) {
      target[key] = data[key];
    } else {
      if (key === 'entityId' && _.has(data, 'id')) {
        target[key] = data['id'];
      } else if (key === 'id' && _.has(data, 'entityId')) {
        target[key] = data['entityId'];
      } else {
        if (_.isUndefined(target[key])) {
          delete target[key];
        }
      }
    }
  });
  return target;
}

export function MapArray<T>(data: any, newTarget: new () => T): any {
  if (_.isEmpty(data) || !_.isArray(data)) {
    return data;
  }
  return _.map(data, (d) => MapData<T>(d, newTarget));
}

export function MapData<T>(data: any, newTarget: new () => T): any {
  if (_.isArray(data)) {
    return MapArray<T>(data, newTarget);
  }
  return MapObject<T>(data, newTarget);
}

import { createModel } from '@rematch/core';
import _ from 'lodash';
import { compare } from 'compare-versions';
import service from '@/config/service';
import { filterServiceMetrics } from '@/utils/metric';

interface IState {
  graphd: any[];
  metad: any;
  storaged: any[];
  spaces: string;
}

export function MetricModelWrapper(serviceApi) {
  return createModel({
    state: {
      graphd: [],
      metad: [],
      storaged: [],
      spaces: [],
    },
    reducers: {
      update: (state: IState, payload: any) => ({
        ...state,
        ...payload,
      }),
    },
    effects: () => ({
      async asyncGetServiceMetric(payload: {
        clusterID?: string;
        componentType: string;
        version: string;
      }) {
        const { componentType, version, clusterID } = payload;
        let metricList = [];
        let spaceMetricList = [];
        switch (true) {
          case compare(version, 'v3.0.0', '<'): {
            const { code, data } = (await serviceApi.getMetrics({
              clusterID,
              'match[]': `{componentType="${componentType}",__name__!~"ALERTS.*",__name__!~".*count"}`,
            })) as any;
            if (code === 0) {
              metricList = data;
            }
            break;
          }
          case compare(version, 'v3.0.0', '>='):
            {
              const { code, data } = (await serviceApi.getMetrics({
                clusterID,
                'match[]': `{componentType="${componentType}",space!="",__name__!~"ALERTS.*",__name__!~".*count"}`,
              })) as any;
              if (code === 0) {
                spaceMetricList = data;
                const { code: _code, data: metricData } =
                  (await serviceApi.getMetrics({
                    clusterID,
                    'match[]': `{componentType="${componentType}",space="",__name__!~"ALERTS.*",__name__!~".*count"}`,
                  })) as any;
                if (_code === 0) {
                  metricList = metricData;
                }
              }
            }
            break;
          default:
            break;
        }
        const metrics = filterServiceMetrics({
          metricList,
          componentType,
          spaceMetricList,
          version,
        });
        this.update({
          [componentType]: metrics,
        });
      },
      async asyncGetSpaces(clusterID: string) {
        const { code, data } = (await service.getSpaces({ clusterID })) as any;
        if (code === 0) {
          this.update({
            spaces: data,
          });
        }
      },
    }),
  });
}

export const serviceMetric = MetricModelWrapper(service);

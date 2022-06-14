import DashboardCard from '@/components/DashboardCard';
import Modal from '@/components/Modal';
import { Col, Row, Spin } from 'antd';
import { connect } from 'react-redux';
import React, { useEffect, useRef, useState } from 'react';
import intl from 'react-intl-universal';
import CPUCard from './Cards/CPUCard';
import './index.less';
import MemoryCard from './Cards/MemoryCard';
import DiskCard from './Cards/DiskCard';
import LoadCard from './Cards/LoadCard';
import NetworkOut from './Cards/NetworkOut';
import NetworkIn from './Cards/NetworkIn';
import { SUPPORT_METRICS, VALUE_TYPE } from '@/utils/promQL';
import {
  MACHINE_TYPE,
  getBaseLineByUnit,
  calcTimeRange,
} from '@/utils/dashboard';
import BaseLineEdit from '@/components/BaseLineEditModal';
import MetricsFilterPanel from '@/components/MetricsFilterPanel';

const mapDispatch: any = (dispatch: any) => ({
  asyncGetCPUStatByRange: dispatch.machine.asyncGetCPUStatByRange,
  asyncGetMemoryStatByRange: dispatch.machine.asyncGetMemoryStatByRange,
  asyncGetMemorySizeStat: dispatch.machine.asyncGetMemorySizeStat,
  asyncGetDiskSizeStat: dispatch.machine.asyncGetDiskSizeStat,
  asyncGetDiskStatByRange: dispatch.machine.asyncGetDiskStatByRange,
  asyncGetLoadByRange: dispatch.machine.asyncGetLoadByRange,
  asyncGetNetworkStatByRange: dispatch.machine.asyncGetNetworkStatByRange,
  asyncUpdateBaseLine: (key, value) =>
    dispatch.setting.update({
      [key]: value,
    }),
  updateMetricsFiltervalues: dispatch.machine.updateMetricsFiltervalues,
});

const mapState = (state: any) => ({
  cpuBaseLine: state.setting.cpuBaseLine,
  memoryBaseLine: state.setting.memoryBaseLine,
  networkOutBaseLine: state.setting.networkOutBaseLine,
  networkInBaseLine: state.setting.networkInBaseLine,
  loadBaseLine: state.setting.loadBaseLine,
  instanceList: state.machine.instanceList as any,
  metricsFilterValues: state.machine.metricsFilterValues,
  loading: state.loading.effects.machine.asyncGetMetricsData,
});

interface IProps
  extends ReturnType<typeof mapDispatch>,
  ReturnType<typeof mapState> {
  cluster?: any;
}

let pollingTimer: any;

function MachineDashboard(props: IProps) {

  const { asyncGetMemorySizeStat, asyncGetDiskSizeStat, cluster, metricsFilterValues,
    asyncUpdateBaseLine, asyncGetCPUStatByRange, asyncGetMemoryStatByRange, asyncGetDiskStatByRange,
    asyncGetLoadByRange, asyncGetNetworkStatByRange, updateMetricsFiltervalues, instanceList,
    loading,
  } = props;

  const [editPanelType, setEditPanelType] = useState<string>('');
  const [showLoading, setShowLoading] = useState<boolean>(false);

  const modalHandlerRef = useRef<any>();

  useEffect(() => {
    asyncGetMemorySizeStat(cluster?.id);
    asyncGetDiskSizeStat(cluster?.id);
    getMachineStatus();
    return () => {
      if (pollingTimer) {
        clearTimeout(pollingTimer);
      }
    }
  }, [cluster])

  useEffect(() => {
    setShowLoading(loading && metricsFilterValues.frequency === 0)
  }, [loading, metricsFilterValues.frequency])

  useEffect(() => {
    if (pollingTimer) {
      clearTimeout(pollingTimer);
    }
    pollingMachineStatus();
  }, [metricsFilterValues.timeRange, metricsFilterValues.frequency])

  const handleConfigPanel = (editPanelType: string) => {
    setEditPanelType(editPanelType);
    modalHandlerRef.current.show();
  };

  const handleBaseLineChange = async value => {
    const { baseLine, unit } = value;
    await asyncUpdateBaseLine(
      `${editPanelType}BaseLine`,
      getBaseLineByUnit({
        baseLine,
        unit,
        valueType: getValueType(editPanelType),
      }),
    );
    handleClose();
  };

  const handleClose = () => {
    modalHandlerRef.current?.hide();
  };

  const getMachineStatus = () => {
    const [start, end] = calcTimeRange(metricsFilterValues.timeRange);
    asyncGetCPUStatByRange({
      start,
      end,
      metric: SUPPORT_METRICS.cpu[0].metric,
      clusterID: cluster?.id
    });
    asyncGetMemoryStatByRange({
      start,
      end,
      metric: SUPPORT_METRICS.memory[0].metric,
      clusterID: cluster?.id
    });
    asyncGetDiskStatByRange({
      start: end - 1000,
      end,
      metric: SUPPORT_METRICS.disk[0].metric,
      clusterID: cluster?.id
    });
    asyncGetLoadByRange({
      start,
      end,
      metric: SUPPORT_METRICS.load[0].metric,
      clusterID: cluster?.id
    });
    asyncGetNetworkStatByRange({
      start,
      end,
      metric: SUPPORT_METRICS.network[0].metric,
      inOrOut: 'in',
      clusterID: cluster?.id
    });
    asyncGetNetworkStatByRange({
      start,
      end,
      metric: SUPPORT_METRICS.network[1].metric,
      inOrOut: 'out',
      clusterID: cluster?.id
    });
  };

  const pollingMachineStatus = () => {
    getMachineStatus();
    if (metricsFilterValues.frequency > 0) {
      pollingTimer = setTimeout(() => {
        pollingMachineStatus();
      }, metricsFilterValues.frequency);
    }
  };

  const getValueType = type => {
    switch (type) {
      case MACHINE_TYPE.cpu:
      case MACHINE_TYPE.memory:
        return VALUE_TYPE.percentage;
      case MACHINE_TYPE.load:
        return VALUE_TYPE.number;
      case MACHINE_TYPE.networkOut:
      case MACHINE_TYPE.networkIn:
        return VALUE_TYPE.byteSecond;
      default:
        return VALUE_TYPE.number;
    }
  };

  const handleMetricsChange = (values) => {
    updateMetricsFiltervalues(values);
  }

  const getViewPath = (path: string): string => {
    if (cluster?.id) {
      return `/clusters/${cluster.id}${path}`;
    }
    return path;
  }

  return (
    <Spin spinning={showLoading}>
      <div className="machine-dashboard">
        <div className='common-header' >
          <MetricsFilterPanel 
            onChange={handleMetricsChange} 
            instanceList={instanceList}
            values={metricsFilterValues}
          />
        </div>
        <Row>
          <Col span={12}>
            <DashboardCard
              title={intl.get('device.cpu')}
              viewPath={getViewPath("/machine/cpu")}
              onConfigPanel={() => handleConfigPanel(MACHINE_TYPE.cpu)}
            >
              <CPUCard />
            </DashboardCard>
          </Col>
          <Col span={12}>
            <DashboardCard
              title={intl.get('device.memory')}
              viewPath={getViewPath("/machine/memory")}
              onConfigPanel={() => handleConfigPanel(MACHINE_TYPE.memory)}
            >
              <MemoryCard />
            </DashboardCard>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <DashboardCard
              title={intl.get('device.load')}
              viewPath={getViewPath("/machine/load")}
              onConfigPanel={() => handleConfigPanel(MACHINE_TYPE.load)}
            >
              <LoadCard />
            </DashboardCard>
          </Col>
          <Col span={12}>
            <DashboardCard
              title={intl.get('device.disk')}
              viewPath={getViewPath("/machine/disk")}
            >
              <DiskCard />
            </DashboardCard>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <DashboardCard
              title={intl.get('device.networkOut')}
              viewPath={getViewPath("/machine/network")}
              onConfigPanel={() =>
                handleConfigPanel(MACHINE_TYPE.networkOut)
              }
            >
              <NetworkOut />
            </DashboardCard>
          </Col>
          <Col span={12}>
            <DashboardCard
              title={intl.get('device.networkIn')}
              viewPath={getViewPath("/machine/network")}
              onConfigPanel={() =>
                handleConfigPanel(MACHINE_TYPE.networkIn)
              }
            >
              <NetworkIn />
            </DashboardCard>
          </Col>
        </Row>
        <Modal
          title="empty"
          className="modal-baseLine"
          width="550px"
          handlerRef={ref => (modalHandlerRef.current = ref)}
          footer={null}
        >
          {/* <BaseLineEdit
            valueType={getValueType(editPanelType)}
            baseLine={props[`${editPanelType}BaseLine`]}
            onClose={handleClose}
            onBaseLineChange={handleBaseLineChange}
          /> */}
        </Modal>
      </div>
    </Spin>
  )
}

export default connect(mapState, mapDispatch)(MachineDashboard);

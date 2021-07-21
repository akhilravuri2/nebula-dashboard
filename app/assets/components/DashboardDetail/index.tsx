import { DETAIL_DEFAULT_RANGE, TIMEOPTIONS } from '@assets/utils/dashboard';
import { DatePicker, Form, Popover, Radio } from 'antd';
import React, { HTMLProps } from 'react';
import dayjs from 'dayjs';

import './index.less';
import { SUPPORT_METRICS } from '@assets/utils/promQL';
import intl from 'react-intl-universal';
import Icon from '../Icon';
import { DashboardSelect, Option } from '../DashboardSelect';

interface IProps extends HTMLProps<any> {
  children: any;
  onTimeChange?: (start:number, end:number) => void
  startTimestamps?: number,
  endTimestamps?: number,
  title?: string;
  typeOptions?: any[]
  currentType?: string,
  metricOptions?: typeof SUPPORT_METRICS.cpu,
  currentMetricOption?: typeof SUPPORT_METRICS.cpu[0],
  onTypeChange?: (type: string) => void
  onMetricChange?: (metric: string, metricOption: any) => void,
  onBaseLineEdit?: () => void,
}



class DashboardDetail extends React.PureComponent<IProps> {
  handleTimeButtonClick = e => {
    const { onTimeChange } = this.props;
    const endTimeStamps = Date.now();
    const startTimeStamps = endTimeStamps - e.target.value;
    if (onTimeChange) {
      onTimeChange(startTimeStamps, endTimeStamps);
    }
  }

  handleTimeRangeChange = ([startDate, endDate]) => {
    const { onTimeChange } = this.props;
    if (onTimeChange) {
      onTimeChange(+startDate, +endDate);
    }
  }

  handleBaseLineEdit= () => {
    const { onBaseLineEdit } = this.props;
    if(onBaseLineEdit ){
      onBaseLineEdit();
    }
  }

  render() {
    const now = Date.now();
    const {
      children,
      typeOptions,
      currentType,
      onTypeChange,
      metricOptions,
      currentMetricOption,
      onMetricChange,
      startTimestamps = now - DETAIL_DEFAULT_RANGE,
      endTimestamps = now,
    } = this.props;
    const interval = endTimestamps - startTimestamps;
    const startDate = dayjs(startTimestamps);
    const endDate = dayjs(endTimestamps);
    return <div className="dashboard-detail">
      <div className="filter">
        <div className="time-range left-panel">
          <Radio.Group onChange={this.handleTimeButtonClick} size="small" value={interval}>
            {
              TIMEOPTIONS.map(option => (
                <Radio.Button key={option.value} value={option.value}>{intl.get(`component.dashboardDetail.${option.name}`)}</Radio.Button>
              ))
            }
          </Radio.Group>
          <DatePicker.RangePicker showSecond={false} format="YYYY-MM-DD HH:mm" value={[startDate, endDate] as any} showTime={true} onChange={this.handleTimeRangeChange as any} allowClear={false}/>
        </div>
        <div className="right-panel">
          {
            typeOptions && <Form.Item>
              <DashboardSelect value={currentType} onChange={onTypeChange} suffixIcon={<Icon icon="#iconnav-foldTriangle" />}>
                {
                  typeOptions.map(option => <Option value={option.value} key={option.value}>{option.name}</Option>)
                }
              </DashboardSelect>
            </Form.Item>
          } 
          {
            metricOptions && <Form.Item className="filter-in-icon">
              <DashboardSelect value={currentMetricOption?.metric} onChange={onMetricChange}>
                {
                  metricOptions.map(option => <Option value={option.metric} key={option.metric}>{option.metric}</Option>)
                }
              </DashboardSelect>
              <Popover content="metric docs">
                <Icon className="metric-info-icon blue" icon="#iconnav-serverInfo" />
              </Popover>
            </Form.Item>
          }
        </div>
        <div className="btn-icon-with-desc blue" onClick={this.handleBaseLineEdit} >
          <Icon icon="#iconSetup" />
          <span>{intl.get('common.baseLine')}</span>
        </div>
      </div>
      <div className="detail-content">
        {children}
      </div>
    </div>;
  }
}

export default DashboardDetail;
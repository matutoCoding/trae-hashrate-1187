import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { useBookingStore } from '@/store/useBookingStore';
// 全局样式
import './app.scss';

function App(props) {
  const { startTimeoutChecker, stopTimeoutChecker, processTimeout } = useBookingStore();

  useEffect(() => {
    console.log('[App] 应用启动');
    startTimeoutChecker();
    processTimeout();

    return () => {
      console.log('[App] 应用卸载');
      stopTimeoutChecker();
    };
  }, [startTimeoutChecker, stopTimeoutChecker, processTimeout]);

  useDidShow(() => {
    console.log('[App] 页面显示');
    processTimeout();
    startTimeoutChecker();
  });

  useDidHide(() => {
    console.log('[App] 页面隐藏');
  });

  return props.children;
}

export default App;

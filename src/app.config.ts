export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/schedule/index',
    'pages/waitlist/index',
    'pages/mine/index',
    'pages/room-detail/index',
    'pages/booking-confirm/index',
    'pages/bill-detail/index',
    'pages/waitlist-register/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '排练室预约',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#7b61ff',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/schedule/index',
        text: '排期'
      },
      {
        pagePath: 'pages/waitlist/index',
        text: '候补'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})

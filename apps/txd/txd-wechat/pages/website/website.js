// pages/website/website.js
// const app = getApp();

Page({
  data: {
    lng: 'zh'
  },
  onShow: function() {
    const {language} = wx.getSystemInfoSync();
    const lng = 'zh' || /zh/i.test(language) ? 'zh' : 'en';
    console.log('language is', language, lng);
    this.setData({lng});
  },
  onShareAppMessage: function(res) {
    return {
      title: 'Techseeding科技',
      // imageUrl: '/images/logo-avatar.png'
    };
  },
  onShareTimeline: function() {
    return {
      title: 'Techseeding科技',
    };
  }
})

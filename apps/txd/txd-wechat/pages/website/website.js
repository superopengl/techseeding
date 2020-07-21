// pages/website/website.js
Page({
  data: {
    language: 'zh'
  },
  onLoad: function() {
    const {language} = wx.getSystemInfoSync();
    this.setData({language});
  },
  onShareAppMessage: function(res) {
    return {
      title: 'Techseeding科技',
      imageUrl: '/images/logo-avatar.png'
    };
  },
})

// pages/website/website.js
Page({
  data: {
    language: 'zh'
  },
  onLoad: function() {
    let {wechatLanguage} = wx.getSystemInfoSync();
    wechatLanguage = 'zh-CH';
    const language = /zh/i.test(wechatLanguage) ? 'zh' : 'en';
    console.log('language is', wechatLanguage, language);
    this.setData({language});
  },
  onShareAppMessage: function(res) {
    return {
      title: 'Techseeding科技',
      imageUrl: '/images/logo-avatar.png'
    };
  },
})

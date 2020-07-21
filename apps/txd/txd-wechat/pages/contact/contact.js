Page({
  data: {
      showTopTips: false,

      radioItems: [
          {name: 'cell standard', value: '0', checked: true},
          {name: 'cell standard', value: '1'}
      ],
      checkboxItems: [
          {name: '网站', value: 'web', checked: false},
          {name: '手机App', value: 'mobile'},
          {name: '微信公众号/小程序', value: 'wechat'},
          {name: '其它 (数据库/大数据/技术咨询/...)', value: 'other'}
      ],

      rules: [{
          name: 'radio',
          rules: {required: true, message: '单选列表是必选项'},
      }, {
          name: 'checkbox',
          rules: {required: true, message: '多选列表是必选项'},
      }, {
          name: 'qq',
          rules: {required: true, message: 'qq必填'},
      }, {
          name: 'mobile',
          rules: [{required: true, message: 'mobile必填'}, {mobile: true, message: 'mobile格式不对'}],
      }, {
          name: 'vcode',
          rules: {required: true, message: '验证码必填'},
      }, {
          name: 'idcard',
          rules: {required: true, message: 'idcard必填'},
      }]
  },
  methods: {
      radioChange: function (e) {
          console.log('radio发生change事件，携带value值为：', e.detail.value);
  
          var radioItems = this.data.radioItems;
          for (var i = 0, len = radioItems.length; i < len; ++i) {
              radioItems[i].checked = radioItems[i].value == e.detail.value;
          }
  
          this.setData({
              radioItems: radioItems,
              [`formData.radio`]: e.detail.value
          });
      },
      checkboxChange: function (e) {
          console.log('checkbox发生change事件，携带value值为：', e.detail.value);
  
          var checkboxItems = this.data.checkboxItems, values = e.detail.value;
          for (var i = 0, lenI = checkboxItems.length; i < lenI; ++i) {
              checkboxItems[i].checked = false;
  
              for (var j = 0, lenJ = values.length; j < lenJ; ++j) {
                  if(checkboxItems[i].value == values[j]){
                      checkboxItems[i].checked = true;
                      break;
                  }
              }
          }
  
          this.setData({
              checkboxItems: checkboxItems,
              [`formData.checkbox`]: e.detail.value
          });
      },
      bindDateChange: function (e) {
          this.setData({
              date: e.detail.value,
              [`formData.date`]: e.detail.value
          })
      },
      formInputChange(e) {
          const {field} = e.currentTarget.dataset
          this.setData({
              [`formData.${field}`]: e.detail.value
          })
      },
      bindTimeChange: function (e) {
          this.setData({
              time: e.detail.value
          })
      },
      bindCountryCodeChange: function(e){
          console.log('picker country code 发生选择改变，携带值为', e.detail.value);
  
          this.setData({
              countryCodeIndex: e.detail.value
          })
      },
      bindCountryChange: function(e) {
          console.log('picker country 发生选择改变，携带值为', e.detail.value);
  
          this.setData({
              countryIndex: e.detail.value
          })
      },
      bindAccountChange: function(e) {
          console.log('picker account 发生选择改变，携带值为', e.detail.value);
  
          this.setData({
              accountIndex: e.detail.value
          })
      },
      bindAgreeChange: function (e) {
          this.setData({
              isAgree: !!e.detail.value.length
          });
      },
      submitForm() {
          this.selectComponent('#form').validate((valid, errors) => {
              console.log('valid', valid, errors)
              if (!valid) {
                  const firstError = Object.keys(errors)
                  if (firstError.length) {
                      this.setData({
                          error: errors[firstError[0]].message
                      })
  
                  }
              } else {
                  wx.showToast({
                      title: '校验通过'
                  })
              }
          })
      }

  }
});

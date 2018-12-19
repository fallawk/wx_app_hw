Page({
  data: {
    pickerHidden: true,
    chosen: '',
    title: 'this is title???'
  },
  NavToReg: function(e){
    wx.navigateTo({
      url: '../login/reg'
    })

  },
  pickerConfirm(e) {
    this.setData({
      pickerHidden: true
    })
    this.setData({
      chosen: e.detail.value
    })
  },

  pickerCancel() {
    this.setData({
      pickerHidden: true
    })
  },

  pickerShow() {
    this.setData({
      pickerHidden: false
    })
  },
  formSubmit(e) {
    //console.log('form发生了submit事件，携带数据为：', e.detail.value)
    AuthUser(e.detail.value)
  },

  formReset(e) {
    this.setData({
      chosen: ''
    })
  }
})

const service = require('../../utils/services.js')

function AuthUser(obj) {
  //console.log(obj.loginName, obj.password)
  if (obj.loginName == '' || obj.password == '') {
    wx.showToast({
      title: '输入错误',
      mask: true,
      icon: 'none',
      duration: 2000
    })
    return  
  }
  wx.showLoading({
    title: '验证中...',
    mask: true
  })
  service.AuthUser(AuthUserHandle, obj)
}

function AuthUserHandle(res) {
  wx.hideLoading()
  if (res.status == 'error') {
    wx.showToast({
      title: res.errmsg,
      mask: true,
      icon: 'none',
      duration: 1000
    })
    return
  } else {
    wx.showToast({
      title: '验证成功',
      mask: true,
      icon: 'none',
      duration: 1000
    })
    wx.setStorageSync('userId', res.loginObj.idprojection)
    wx.switchTab({
      url: '../index/index',
    })
  }
}


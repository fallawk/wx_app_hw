const service = require('../../utils/services.js')
const date = new Date()
const years = []
const months = []
const days = []

for (let i = date.getFullYear(); i <= 2019; i++) {
  years.push(i)
}

for (let i = 1; i <= 12; i++) {
  months.push(i)
}

for (let i = 1; i <= 31; i++) {
  days.push(i)
}

Page({ 
  data: {
    years,
    year: date.getFullYear(),
    months,
    month: date.getMonth(),
    days,
    day: date.getDate(),
    value: [0, date.getMonth(), date.getDate()-1, 0],
    isDaytime: true,
    isPickerShow: false
  },
  bindChange(e) {
    const val = e.detail.value
    //console.log(this.data.months)
    this.setData({
      year: this.data.years[val[0]],
      month: this.data.months[val[1]]-1,
      day: this.data.days[val[2]],
      value: val,
      isDaytime: !val[3]
    })
  },
  onLoad: function(){  
    service.GetDocClassList(function(res){
      //console.log(res)
      if (res.statusCode != 200) {
        wx.showToast({
          title: '网路错误',
          icon: 'none',
          duration: 2000
        })
        return
      }
      var pages = getCurrentPages(), p = pages[pages.length-1]
      
      var list = res.data
      for (let item of list) {
        item['open'] = false
        //item['pages'] = []
      }
      p.setData({list: list})
    })
  },
  datePickerToggle() {
    var isShow = this.data.isPickerShow
    this.setData({isPickerShow: !isShow})
  },
  kindToggle(e) {
    const id = e.currentTarget.id
    const list = this.data.list
    //console.log(list, id)
    for (let i = 0, len = list.length; i < len; ++i) {
      //console.log(list[i].id, id)
      if (list[i].id == id) {
        list[i].open = !list[i].open
      } else {
        list[i].open = false
      }
    }
    this.setData({
      list
    })
    //wx.reportAnalytics('click_view_programmatically', {})
  }
})

function commonCallBack(res) {
  console.log(res)
}
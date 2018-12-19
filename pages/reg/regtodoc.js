// pages/reg/regtodoc.js
const service = require('../../utils/services.js')
const util = require('../../utils/util.js')

Page({

  /**
   * Page initial data
   */
  data: {
    DocId: 0,
    DocName: "请稍后",
    DocDesc: "...",
    regdate: {},
    canReg: false
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {
    //console.log(options)
    this.setData({
      DocId: options.id,
      ClassId: options.classid,
      Time: options.time
    })
    service.GetDocById(function(res){
      if (res.statusCode != 200) return
      var pages = getCurrentPages()
      var p = pages[pages.length - 1]
      //console.log(getCurrentPages())
      p.setData({
        DocName: res.data.name,
        DocDesc: res.data.profession
      })
      var dateArray = options.time.split(',')
      //console.log(dateArray)
      var year_curr = new Date().getFullYear()
      var date = new Date(year_curr+parseInt(dateArray[0]), parseInt(dateArray[1]), parseInt(dateArray[2])+1)
      var queue = res.data.queue
      //console.log(res.data)
      p.setData({regdate: {
        "date": date,
        "ampm": parseInt(dateArray[3])
      }})
      if (queue.length == 0) {
        p.setData({ canReg: true })
        return
      }
      for (let itm of queue) {
        //console.log(itm)
        if (itm.date == util.formatDate(date) && itm.ampm == parseInt(dateArray[3])) {
          if (itm.status == 1) { // full
            wx.showToast({
              title: '抱歉，此时段预约队列已满',
              icon: "none",
              duration: 2000
            })
          } else {
            p.setData({canReg: true})
          }
          return
        }
        p.setData({canReg: true})
      }
      //console.log(util.formatDate(date))

    }, options.id)
  },

  reg: function(e) {
    //console.log(e)
    var patientid = wx.getStorageSync('userId')
    service.AddReg(AddRegCallBack, this.data.DocId, this.data.ClassId, util.formatDate(this.data.regdate.date), this.data.regdate.ampm, patientid)

  },

  recommand: function() {
    // tmp user vector
    // var uservector = {
    //   a0: 2 * Math.random() - 1,
    //   a1: 2 * Math.random() - 1,
    //   a2: 2 * Math.random() - 1,
    //   a3: 2 * Math.random() - 1,
    //   a4: 2 * Math.random() - 1
    // }
    var pages = getCurrentPages(), p = pages[pages.length - 1]
    service.GetPatientById(function (res) {
      //console.log(uservector)
      var uservector = res.data.vectorize
      //console.log(uservector)
      service.GetClassById(function (res) {
        //console.log(res)
        var pages = getCurrentPages(), p = pages[pages.length - 1]
        var doclist = res.data.doclist, curr_max = -Infinity, recommId
        //console.log(curr_max)
        for (let doc of doclist) {
          let queues = doc.queue, flag = true
          for (let q of queues) {
            if (q.date == util.formatDate(p.data.regdate.date) && q.ampm == p.data.regdate.ampm) {
              flag = false
              if (q.status == 1) break
              else {
                let score = InnerProduct(uservector, doc.vectorize)
                if (score > curr_max) {
                  curr_max = score
                  recommId = doc.id
                }
              }
            }
          }
          if (flag) {
            //no queue yet
            let score = InnerProduct(uservector, doc.vectorize)
            if (score > curr_max) {
              curr_max = score
              recommId = doc.id
            }
          }
        }

        if (curr_max > -Infinity) {
          wx.redirectTo({
            url: '/pages/reg/regtodoc?id=' + recommId + '&time=' + p.data.Time + '&classid=' + p.data.ClassId,
          })
        } else {
          wx.showToast({
            title: '暂无可用推荐',
            duration: 2000,
            icon: 'none'
          })
        }
      }, p.data.ClassId)
    }, wx.getStorageSync('userId'))    
  }
})

function InnerProduct(v1, v2) {
  return v1.a0*v2.a0+v1.a1*v2.a1+v1.a2*v2.a2+v1.a3*v2.a3+v1.a4*v2.a4
}

//console.log('regtodoc inited')
function AddRegCallBack(res) {
  //console.log(res)
  if (res.statusCode == 200) {
    wx.redirectTo({
      url: '/pages/reg/regpay?regid=' + res.data.id,
    })
  } else {
    wx.showToast({
      title: '网络错误，请稍后重试',
      icon: 'none',
      duration: 2000
    })
  }
}

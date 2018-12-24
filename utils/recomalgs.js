var service = require('services.js')

const updateWeights = function (patientId, docClassId) {
  //update last visited doc's vec (same class) and curr patient's
  service.GetPatientById(function(re){
    if (re.statusCode == 200) {
      var patVec = re.data.vectorize, regs = re.data.regs
      for (let reg of regs) {
        let tmp = new Date(reg.date)
        if (tmp < new Date() && docClassId == reg.regtoclass.toString()) {
          service.GetDocById(function(res){
            if (res.statusCode != 200) return
            let obj = computeGradient(patVec, res.data.vectorize, getEstimatedRating(new Date(), new Date(reg.date)))
            console.log(obj)
            //console.log(res.data, patVec)
            service.UpdateWeights(0, reg.regtodoc.toString(), vecSub(res.data.vectorize, obj.docGradient))
            service.UpdateWeights(1, patientId, vecSub(patVec, obj.patGradient))
          }, reg.regtodoc.toString())
        }
      }
    }
  }, patientId)
}

function getEstimatedRating(date1, date2) {
  //var lastDate = new Date(date1), nowDate = new Date(date2)
  return activate(Math.log((date1 - date2)/1000/60/60/24)
}

function activate(value) {
  return 1 / (1 + Math.pow(Math.E, -value))
}

function vecSub(v1, v2) {
  return {
    'a0': v1.a0-v2.a0,
    'a1': v1.a1-v2.a1,
    'a2': v1.a2-v2.a2,
    'a3': v1.a3-v2.a3,
    'a4': v1.a4-v2.a4
  }
}

function computeGradient(patVec, docVec, estimRate) {
  var baseDiff = innerProduct(patVec, docVec) - estimRate
  return {'patGradient': {
            'a0': baseDiff * docVec.a0,
            'a1': baseDiff * docVec.a1,
            'a2': baseDiff * docVec.a2,
            'a3': baseDiff * docVec.a3,
            'a4': baseDiff * docVec.a4
          },
          'docGradient': {
            'a0': baseDiff * patVec.a0,
            'a1': baseDiff * patVec.a1,
            'a2': baseDiff * patVec.a2,
            'a3': baseDiff * patVec.a3,
            'a4': baseDiff * patVec.a4
          }
  }
}



function innerProduct(v1, v2) {
  return v1.a0 * v2.a0 + v1.a1 * v2.a1 + v1.a2 * v2.a2 + v1.a3 * v2.a3 + v1.a4 * v2.a4
}

module.exports = {
  updateWeights
}
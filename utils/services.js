const baseUrl = 'http://47.107.241.57:8080/Entity/U1c735ba223c59f/MobMed/';

const GetUsers = function(callBack) {
  var obj = {
    url: baseUrl + 'Users',
    method: 'GET',
    data: {},
    callBack: callBack
  }
  restfulService(obj)
}

const AddUser = function(callBack, loginName, pwdhash, realName, gender, age) {
  // always adds user as patient via mobile app
  var passing_obj = {
    userobj: {
      'username': loginName,
      'pwdhash': pwdhash,
    },
    patientobj: {
      'name': realName,
      'gender': gender,
      'age': age
    },
    callBack: callBack
  }  
  // create/init a vector
  // create a patient obj
  // bind vector to patient
  InitVector(passing_obj)
}

function InitUser(PatientRes, passing_obj) {
  if (PatientRes.statusCode != 200) {
    passing_obj.callBack(PatientRes)
    return
  }
  passing_obj.userobj['idprojection'] = PatientRes.data.id
  var obj = {
    url: baseUrl + 'users/',
    method: 'POST',
    data: passing_obj.userobj,
    callBack: passing_obj.callBack 
  }
  restfulService(obj, passing_obj)
}

function InitPatient(VecRes, passing_obj) {
  // console.log(VecRes)
  if (VecRes.statusCode != 200) {
    console.log('network error')
    passing_obj.callBack(VecRes)
    return
  }
  passing_obj.patientobj['vectorize'] = {'id': VecRes.data.id}
  //console.log(passing_obj.patientobj)
  var obj = {
    url: baseUrl + 'patient2/',
    method: 'POST',
    data: passing_obj.patientobj,
    callBack: InitUser
  }
  restfulService(obj, passing_obj)
}

function InitVector(passing_obj) {
  var dataobj = {
    'a0': 2 * Math.random() - 1,
    'a1': 2 * Math.random() - 1,
    'a2': 2 * Math.random() - 1,
    'a3': 2 * Math.random() - 1,
    'a4': 2 * Math.random() - 1
  }
  var obj = {
    url: baseUrl + 'vectorization/',
    method: 'POST',
    data: dataobj,
    callBack: InitPatient
  }
  restfulService(obj, passing_obj)
}

const ModUser = function(callBack, dataobj, passing_obj) {
  var obj = {
    url: baseUrl + 'users/' + dataobj['id'],
    method: 'PUT',
    data: dataobj,
    callBack: callBack
  }
  restfulService(obj, passing_obj)
}

const SrchUser = function(callBack, passing_obj) {
  //console.log(passing_obj)
  var obj = {
    url: baseUrl + 'users/?Users.username=' + passing_obj.loginName,
    method: 'GET',
    data: {},
    callBack: callBack
  }
  restfulService(obj, passing_obj)
}

const GetDocClassList = function(callBack) {
  //GetDocClassListStatic(callBack)
  var obj = {
    'url': baseUrl + 'Department/',
    'method': 'GET',
    'callBack': function(re) {
      if (re.statusCode != 200) callBack(re)
      else {
        callBack({'statusCode': 200,
          'data': re.data.Department
        })
      }
    }
  }
  restfulService(obj)
}
function fetchDoclist(DocClassRes, callBack) {
  if (DocClassRes.statusCode == 200) {
    var doclist = DocClassRes.data.doclist
    DocClassRes.data = doclist
  }
  callBack(DocClassRes)
}

function Auth(res, passing_obj) {
  //console.log(res)
  //console.log(passing_obj)
  var re = new Object
  if (res.statusCode != 200) {
    re['status'] = 'error'
    re['errmsg'] = '网络错误'
  } else {
    if (res.data.Users && res.data.Users.length == 1) {
      var pwdhash = res.data.Users[0].pwdhash
      if (pwdhash == passing_obj.password) {
        re['status'] = 'success'
        // re['loginName'] = passing_obj.loginName
        re['loginObj'] = res.data.Users[0]
      } else {
        re['status'] = 'error'
        re['errmsg'] = '密码错误'
      }
    } else {
      re['status'] = 'error'
      re['errmsg'] = '用户名错误'
    }  
  }
  passing_obj.callBack(re)
}

const AuthUser = function(callBack, loginObj) {
  var obj = loginObj
  obj['callBack'] = callBack
  SrchUser(Auth, obj)
}

//const GetDocById = function(callBack, id) {}
const GetDocById = function(callBack, id) {
  //GetDocByIdStatic(callBack, id)
  var obj = {
    'url': baseUrl + 'Doctor2/' + id,
    'method': 'GET',
    'data': {},
    'callBack': callBack 
  }
  restfulService(obj)
}

const AddReg = function (callBack, docid, classid, date, ampm, patientid) {
  //Add A Registration, append to doc's queue, associate with patient's reg records
  var obj = {
    'url': baseUrl + 'Registration/',
    'method': 'POST',
    'data': {
      'ispaid': 0,
      'date': date,
      'price': 18.0,
      'ampm': parseInt(ampm),
      'regtodoc': parseInt(docid),
      'regtoclass': parseInt(classid)
    },
    'callBack': function(re, passing_obj) {
      //callBack(re)
      if (re.statusCode != 200) {
        passing_obj.callBack(re) //create reg failed, back to caller
        return
      }
      console.log('creating reg done')
      passing_obj['reg'] = re.data //hold reg obj for later use
      //find patient, associate reg with it 
      var obj = {
        //find curr patient obj
        'url': baseUrl + 'Patient2/' + passing_obj.patientId,
        'method': 'GET',
        'data': {},
        'callBack': function (re, passing_obj) {
          //this callback to associate patient obj with regId
          if (re.statusCode != 200) {
            passing_obj.callBack(re)
            return
          }
          //console.log('searching patient done')
          //console.log(re)
          re.data.regs.push({
            'id': passing_obj.reg.id
          })
          var obj = {
            'url': baseUrl + 'Patient2/' + passing_obj.patientId,
            'method': 'PUT',
            'data': re.data,
            'callBack': function(re, passing_obj) {
              //time to enqueue reg into doc's queue pool
              if (re.statusCode != 200) {
                passing_obj.callBack(re)
                return
              }
              //console.log('updating patient done')
              //fetch doc obj
              var obj = {
                'url': baseUrl + 'Doctor2/' + passing_obj.reg.regtodoc,
                'method': 'GET',
                'data': {},
                'callBack': function(re, passing_obj) {
                  if (re.statusCode != 200) {
                    passing_obj.callBack(re)
                    return
                  }
                  //console.log('search doc done')
                  var q = re.data.queue
                  //var flag = false
                  for (let itm of q) {
                    //console.log(itm.date, passing_obj.reg.data, itm.ampm, passing_obj.reg.ampm)
                    if (itm.date == passing_obj.reg.date && itm.ampm == passing_obj.reg.ampm) {
                      //flag = true
                      console.log('corresponding queue found')
                      itm.reg.push({
                        'id': passing_obj.reg.id
                      })
                      //console.log(itm)
                      if (itm.reg.length >= 3) {
                        itm.status = 1
                      }
                      //update doc's queue
                      var obj = {
                        'url': baseUrl + 'Queue2/' + itm.id,
                        'method': 'PUT',
                        'data': itm,
                        'callBack': function(re, passing_obj) {
                          if (re.statusCode != 200) {
                            passing_obj.callBack(re)
                            return
                          }
                          console.log('update queue done')
                          passing_obj.callBack({
                            'statusCode': 200,
                            'data': passing_obj.reg
                          })
                        }
                      }
                      restfulService(obj, passing_obj)  
                      return
                    }
                  }
                  //corresponding queue not found
                  //console.log('corresponding queue not found')
                  passing_obj['doc'] = re.data
                  //create a new queue
                  var obj = {
                    'url': baseUrl + 'Queue2/',
                    'method': 'POST',
                    'data': {
                      'date': passing_obj.reg.date,
                      'ampm': passing_obj.reg.ampm,
                      'status': 0,
                      'reg': [
                        {
                          'id': passing_obj.reg.id
                        }
                      ]  
                    },
                    'callBack': function(re, passing_obj) {
                      if (re.statusCode != 200) {
                        passing_obj.callBack(re)
                        return
                      }
                      //console.log('create queue done')
                      //now we have newly created queue obj, associate with correspending doc, doc obj is stored in passing_obj
                      var docobj = passing_obj.doc
                      docobj.queue.push({
                        'id': re.data.id
                      })
                      var obj = {
                        'url': baseUrl + 'Doctor2/' + docobj.id,
                        'method': 'PUT',
                        'data': docobj,
                        'callBack': function(re, passing_obj) {
                          //now we are finally done
                          if (re.statusCode != 200) {
                            passing_obj.callBack(re)
                            return
                          }
                          //console.log('update doc done')
                          passing_obj.callBack({
                            'statusCode': 200,
                            'data': passing_obj.reg
                          })
                        }
                      }
                      restfulService(obj, passing_obj)
                    }
                  }
                  restfulService(obj, passing_obj)
                }
              }
              restfulService(obj, passing_obj)
            }
          }
          restfulService(obj, passing_obj)
        }
      }
      restfulService(obj, passing_obj)
    }
  }
  restfulService(obj, {'callBack':callBack, 'patientId': patientid})
}

const GetDocListByClassId = function (callBack, classid) {

}

const GetRegById = function (callBack, id) {
  //AddRegStatic(callBack)
  var obj = {
    'url': baseUrl + 'Registration/' + id,
    'method': 'GET',
    'data': {},
    'callBack': callBack
  }
  restfulService(obj)
}

const GetClassById = function(callBack, id) {
  var obj = {
    'url': baseUrl + 'Department/' + id,
    'method': 'GET',
    'data': {},
    'callBack': callBack
  }
  restfulService(obj)
}

const PayReg = function(callBack, id) {
  //PayRegStatic(callBack, id)
  var obj = {
    'url': baseUrl + 'Registration/' + id,
    'method': 'GET',
    'data': {},
    'callBack': function(res, passing_obj) {
      if (res.statusCode != 200) {
        passing_obj.callBack(res)
        return
      }
      res.data.ispaid = 1
      var obj = {
        'url': baseUrl + 'Registration/' + res.data.id,
        'method': 'PUT',
        'data': res.data,
        'callBack': passing_obj.callBack
      }
      restfulService(obj)
    }
  }
  restfulService(obj, {'callBack': callBack})
}

const GetPatientById = function(callBack, id) {
  var obj = {
    'url': baseUrl + 'patient2/' + id,
    'method': 'GET',
    'data': {},
    'callBack': callBack
  }
  restfulService(obj)
}

const UpdateWeights = function(type, id, vecobj) {
  //type 0 doc, 1 pat
  var url = baseUrl + (type == 0 ? 'doctor2/' : 'patient2/')
  var obj = {
    'url': url + id,
    'method': 'GET',
    'data': {},
    'callBack': function(re) {
      if (re.statusCode != 200) return
      var obj = {
        'url': baseUrl + 'Vectorization/' + re.data.vectorize.id,
        'method': 'PUT',
        'data': vecobj,
        'callBack': function(res) {
          if (res.statusCode == 200) {
            console.log('update complete')
          } else {
            console.log('update failed')
          }
        }
      }
      restfulService(obj)
    }
  }
  restfulService(obj)
}

function restfulService (req_obj, passing_obj) {
  //obj: 4 attri at least: url, method, data, callBack
  wx.request({
    url: req_obj.url,
    method: req_obj.method,
    data: JSON.stringify(req_obj.data),
    complete(re) {
      //console.log(req_obj)
      //console.log(re)
      req_obj.callBack(re, passing_obj)
    }
  })
}

module.exports = {
  AddUser,
  ModUser,
  GetUsers,
  SrchUser,
  AuthUser,
  GetDocClassList,
  GetClassById,
  //GetDocListByClassId,
  GetPatientById,
  GetDocById,
  GetClassById,
  GetRegById,
  AddReg, 
  UpdateWeights,
  //EmptyResourceByName,
  PayReg
}


// to optimize code structure use module.exports to split test suites into different files. 

// ********************************************************************************************
// ***                                 Wrangle Test Driver  Globals & Dependencies          ***
// ********************************************************************************************
      // Require chai.js expect module for assertions
      var chai = require('chai'),
          //expect = chai.expect,
          assert = chai.assert,
          expect = chai.expect,
          //assert = require('chai').assert, 
          should = chai.should(),
          //diff = require('deep-diff').diff,
          _ = require('underscore'),
          supertest = require('supertest'),
          parallel = require('mocha.parallel'),
          //stringify = require('node-stringify'),
          //json = require('json'),

         // _eci =  "B70F0DBA-13AD-11E6-A0DA-C293E71C24E1",
          _eci =  "5A3F0D2A-326F-11E6-B090-459EE71C24E1",

          _pico_used='', // can be parent , a , b
          wrangler_dev = "b507805x0.dev", 
          wrangler_prod = 'v1_wrangler.dev',
          bootstrap_rid = "b507199x1.dev",
          picoLogs = "b16x29";
          testing_rid1 = "b507706x12.dev",// used to install, uninstall and query meta data 
          testing_rid2 = "b507706x13.dev",// used to install, uninstall and query meta data 

          //event_api = supertest("https://kibdev.kobj.net/sky/event/"+_eci+"/123/wrangler"),
          sky_query = supertest("https://kibdev.kobj.net/sky/cloud/"+wrangler_prod),
          childSkyQuery = supertest("https://kibdev.kobj.net/sky/cloud/"+wrangler_dev),
          pico_A={},
          pico_B={},
          _eid={
            eid:0,
            pico:'parent',
            suite:'Start',
            state:'passed'
          };
          //_eid_before={
          //  eid:0,
          //  pico:'parent',
          //  suite:''
          //};
//*************************** Channels *****************************
          policy_string1 ='never take prisoners, never be taken alive';
          channel_for_testing1 = {
            channel_name:"Time Wizard",
            channel_type:"TestDriver",
            attributes: "time warping",
            policy: JSON.stringify({policy :policy_string1})
          };
          policy_string2 = 'no wasted parts';
          channel_for_testing2 = {
            channel_name:"Chimera",
            channel_type:"TestDriver",
            attributes: "fire-breathing",
            policy: JSON.stringify({policy :policy_string2})
          };
          policy_string3 = 'drive on ward';
          channel_for_testing3 = {
            channel_name:"Hippocampus",
            channel_type:"TestDriver",
            attributes: "wave surfing",
            policy: JSON.stringify({policy : policy_string3})
          };
//*************************** Subscriptions *****************************
          subscriptions_for_testing1 = {
            name: "subscription1",
            name_space: 'test',
            my_role: 'Pico_A',
            subscriber_role: 'Pico_B',
            subscriber_eci: '',
            channel_type: 'test',
            attrs: 'attributes'
          };

          subscriptions_for_testing2 = {};
          subscriptions_for_testing3 = {};
          function eventIDs(){
            var suiteName = "",
            _parent_log_eid= [], 
            _pico_A_log_eid= [], 
            _pico_B_log_eid= [];
            var Logs = {
              parent:[],
              A:[],
              B:[]
            };
            var suiteLogs = []; // array of suite:Logs
            return {
              A: function(){
                return _pico_A_log_eid;
              },
              B: function(){
                return _pico_B_log_eid;
              },
              parent: function(){
                return _parent_log_eid;
              },
              suiteName: function(){
                return suiteName;
              },
              Logs: function(){
                return suiteLogs;
              },
              updateA: function(){
                if (_eid.eid!= ''){
                Logs.A.push(_eid.eid);
                //Logs.A.push(_eid_before);
                } 
              },
              updateB: function(){
                if (_eid.eid!= ''){
                Logs.B.push(_eid.eid);
                //Logs.B.push(_eid_before);
                } 
              },
              updateParent: function(){
                if (_eid.eid!= ''){
                  Logs.parent.push(_eid.eid);
                } 
                //Logs.parent.push(_eid_before);
              },
              updateLogs: function(suite){
                param = {};
                param[suite] = Logs;
                suiteLogs.push( param );
                Logs =  { // reset Logs
                  parent:[],
                  A:[],
                  B:[]
                };
              },
              resetLogs: function(suite){
                Logs =  { // reset Logs
                  parent:[],
                  A:[],
                  B:[]
                };
                _eid.eid = '';
              },
              updateSuiteName: function(state){
                suiteName = state;
              }
            } 
          };
          var eidLogs = eventIDs();


          function eid(pico){
            pico = pico || 'parent';
            _eid.pico = pico;
            //_eid_before = _eid;
            _eid.eid = Math.floor(Math.random() * 9999999);
            return _eid.eid;
          };
          //function EventApi(eci, domain = 'wrangler') {
            function EventApi(eci,pico, domain) {
              pico = pico || 'parent';
              domain = domain || "wrangler";
              _eid.pico = pico;
              //_eid_before = _eid;
              _eid.eid = Math.floor(Math.random() * 9999999);
              return supertest("https://kibdev.kobj.net/sky/event/"+eci+"/"+_eid+"/"+domain);
            };
            function logs(eci,done){
              var results;
              supertest("https://kibdev.kobj.net/sky/cloud/"+picoLogs).get("/getLogs")
              .query({ _eci: eci })
              .expect(200)
              .end(function(err,res){
                results = res.text;
                results = JSON.parse(response);
                console.log("logs",results);
              //results = _.filter(results, function(log){ return log.eid == _eid; });
              done();
            });

              return results;
            }


// ********************************************************************************************
// ***                                 Wrangle Test Driver                                  ***
// ********************************************************************************************

describe('Wrangler Test Driver', function() {

      //  this.slow(200000);// this might take some time.
      this.timeout(50000);
      this.retries(4);
        afterEach(function() { // build a list of logs to print at the end of test.
          //console.log("current event ID",_eid);
             // console.log("currentTest",this.currentTest);
          if (this.currentTest.state == 'failed' || this.currentTest.state == 'undefined' ) {
              _eid.state = this.currentTest.state;
          };
          if(eidLogs.suiteName() != _eid.suite){ // entered a new suite
             // console.log('>>>>>>>>>>>New SUITE ',this);
            if (_eid.state == 'failed' || _eid.state == 'undefined' ) {
                eidLogs.updateLogs(eidLogs.suiteName());
            };
            eidLogs.resetLogs();
            eidLogs.updateSuiteName(_eid.suite);

            _eid.state = "passed"; // reset suite state. 
          };
          switch(_eid.pico){
            case 'parent':
              eidLogs.updateParent();
              break;
            case 'a':
              eidLogs.updateA();
              break;
            case 'b':
              eidLogs.updateB();
              break;
            }


        //console.log("eid list", _log_eid);
      });       
// ********************************************************************************************
// ***                               Initialize Testing Environment                         ***
// ********************************************************************************************

        describe('Initialize Testing Environment', function() {
      //check if list children works for creatChild test. 
      describe('children(_eci)', function() {
        
        it('update suite variable ',function(done) {
          _eid.suite = 'Initialize Testing Environment';
          done();
        });
        
        it('array of child tuples errors if not 200', function(done) {
          
          sky_query.get('/children')
          .set('Accept', 'application/json')
          .query({ _eci: _eci, _eid: eid()})
          .expect(200, done)
          .expect('Content-Type', /json/)
        });
      });
      //Check if install ruleset works for creatChild test. 
      describe('list/install/list/uninstall ruleset('+ testing_rid1+')', function() {
        var first_response;
        var second_response;
        it('update suite variable ',function(done) {
          _eid.suite = 'list/install/list/uninstall ruleset('+ testing_rid1+')';
          done();
        });

        it('stores list of current rulesets',function(done) {
          sky_query.get("/rulesets")
          .query({ _eci: _eci,_eid: eid()})
          .expect(200)
          .end(function(err,res){
            response = res.text;
            first_response = JSON.parse(response);
            assert.equal(true,first_response.status);
            done();
          });
        });


        it('install ruleset', function(done) {
         EventApi(_eci).get('/install_rulesets_requested')
         .set('Accept', 'application/json')
         .query({rids : testing_rid1 })
         .expect(200)
         .end(function(err,res){
          done();
        });
       });
        it('stores list of updated installed ruleset',function(done) {
         sky_query.get("/rulesets")
         .query({ _eci: _eci ,_eid: eid()})
         .expect(200)
         .end(function(err,res){
          response = res.text;
          second_response = JSON.parse(response);
          assert.equal(true,second_response.status);
          done();
        }); 
       });

        it('compares updated list of rules with previous to insure only desired ruleset was installed', function() {
          var installed_rulesets = _.difference( second_response.rids, first_response.rids);
          //assert
          if (((installed_rulesets.length) != 1 )){
            console.log("before install",first_response.rids);
            console.log("after install",second_response.rids);
            console.log("difference",installed_rulesets);
            if(((installed_rulesets.length) > 1 )){
              throw new Error("multiple new installed rulesets");
            }else{
              throw new Error("no new installed rulesets");
            }
          } 
          else if (installed_rulesets[0]!=testing_rid1){
            console.log("difference",installed_rulesets);
            throw new Error("wrong ruleset installed should of been"+testing_rid1);
          }
        });
        it('uninstall ruleset '+testing_rid1, function(done) {
          EventApi(_eci).get('/uninstall_rulesets_requested')
          .set('Accept', 'application/json')
          .query({rids : testing_rid1 })
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err,res){
            done();
          });
        });
        it('list should not include '+testing_rid1, function(done) {
          sky_query.get("/rulesets")
          .query({ _eci: _eci ,_eid: eid()})
          .expect(200)
          .end(function(err,res){
            response = res.text;
            first_response = JSON.parse(response);
            assert.equal(true,first_response.status);
            assert.notInclude(first_response.rids,testing_rid1,"should not include");
            done();
          });
        });

      });

// ********************************************************************************************
// ***                               CreateChild Pico A & B For Testing                     ***
// ********************************************************************************************
      describe('CreateChild Pico A & B For Testing', function() {
        var first_response;
        var second_response;
        var new_pico;

        // get list of children and store for difference check.
        // get list of children to check for new child with the previous list,
        it('update suite variable ',function(done) {
          _eid.suite = 'CreateChild Pico A & B For Testing';
          done();
        });

        it("stores list of current children",function(done) {
          sky_query.get('/children')
          .set('Accept', 'application/json')
          .query({ _eci: _eci ,_eid: eid()})
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err,res){
            response = res.text;
            first_response = JSON.parse(response);
            done();
          });
        });
        // create child
        it('create child "A" pico', function(done) {
          EventApi(_eci).get('/child_creation')
          .set('Accept', 'application/json')
          .query({ name: 'Pico_A' })
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err,res){
           done();
         });
        }); 
        it('store updated children picos',function(done) {
          this.retries(2);
          sky_query.get('/children')
          .set('Accept', 'application/json')
          .query({ _eci: _eci,_eid: eid()})
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err,res){
            response = res.text;
            second_response = JSON.parse(response);
            done();
          });
        });
        it('compares updated list of picos to confirm successful creation, stores pico A eci for testing', function() {
          first_results = first_response.children =="error" ? []: first_response.children;
          second_results = second_response.children =="error" ? []: second_response.children;
          var first_response_ecis = _.map(first_results, function(child){ return child[0]; });
          var second_response_ecis = _.map(second_results, function(child){ return child[0]; });
          var new_Pico_eci = _.difference( second_response_ecis, first_response_ecis  );
          new_pico = _.filter(second_results, function(eci){ return eci[0] == new_Pico_eci; });
          pico_A = new_pico;
          //console.log("Pico_A",pico_A);
          if (((pico_A.length) != 1 )){
            console.log("first_response:");
            console.log(first_results);
            console.log("second_response:");
            console.log(second_results);
            console.log("first_response mapped:");
            console.log(first_response_ecis);
            console.log("second_response mapped:");
            console.log(second_response_ecis);
            console.log("difference:");
            console.log(new_Pico_eci);
            console.log("second_response filtered:");
            console.log(pico_A);
            console.log(pico_A[0][0]);
            if(((pico_A.length) > 1 )){
              throw new Error("multiple new installed rulesets");
            }else{
              throw new Error("no new installed rulesets");
            }

          }
        });
        it('create child "B" pico', function(done) {
          EventApi(_eci).get('/child_creation')
          .set('Accept', 'application/json')
          .query({ name: 'Pico_B' })
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err,res){
           done();
         });
        });

        it('store updated children picos',function(done) {
          first_response = second_response;
          this.retries(2);
          sky_query.get('/children')
          .set('Accept', 'application/json')
          .query({ _eci: _eci,_eid: eid()})
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err,res){
            response = res.text;
            second_response = JSON.parse(response);
            done();
          });
        });

        it('compares updated list of picos to confirm successful creation, stores pico B eci for testing', function() {
          first_results = first_response.children =="error" ? []: first_response.children;
          second_results = second_response.children =="error" ? []: second_response.children;
          var first_response_ecis = _.map(first_results, function(child){ return child[0]; });
          var second_response_ecis = _.map(second_results, function(child){ return child[0]; });
          var new_Pico_eci = _.difference( second_response_ecis, first_response_ecis  );
          new_pico = _.filter(second_results, function(eci){ return eci[0] == new_Pico_eci; });
          pico_B = new_pico;
          //console.log("Pico_B",pico_B);
          if (((pico_B.length) != 1 )){
            console.log("first_response:");
            console.log(first_results);
            console.log("second_response:");
            console.log(second_results);
            console.log("first_response mapped:");
            console.log(first_response_ecis);
            console.log("second_response mapped:");
            console.log(second_response_ecis);
            console.log("difference:");
            console.log(new_Pico_eci);
            console.log("second_response filtered:");
            console.log(pico_B);
            console.log(pico_B[0][0]);
            if(((pico_B.length) > 1 )){
              throw new Error("multiple new installed rulesets");
            }else{
              throw new Error("no new installed rulesets");
            }
          }
        });
//        parallel('install rulesets in picos', function() {
        it('install wrangler.dev('+wrangler_dev+') ruleset in Pico A', function(done) {
         this.retries(2);
         EventApi(pico_A[0][0],'a').get('/install_rulesets_requested')
         .set('Accept', 'application/json')
         .query({rids : wrangler_dev })
         .expect(200)
         .end(function(err,res){
          done();
        });
       });
        it('install wrangler.dev('+wrangler_dev+') ruleset in Pico B', function(done) {
         this.retries(2);
         EventApi(pico_B[0][0],'b').get('/install_rulesets_requested')
         .set('Accept', 'application/json')
         .query({rids : wrangler_dev })
         .expect(200)
         .end(function(err,res){
          done();
        });
       });
        it('install pico logging('+picoLogs+') ruleset in Pico A', function(done) {
         this.retries(2);
         EventApi(pico_A[0][0],'a').get('/install_rulesets_requested')
         .set('Accept', 'application/json')
         .query({rids : picoLogs })
         .expect(200)
         .end(function(err,res){
          done();
        });
       });
        it('install pico logging('+picoLogs+') ruleset in Pico B', function(done) {
         this.retries(2);
         EventApi(pico_B[0][0],'b').get('/install_rulesets_requested')
         .set('Accept', 'application/json')
         .query({rids : picoLogs })
         .expect(200)
         .end(function(err,res){
          done();
        });
       });
//      });
        it('enables pico A logging', function(done) {
         this.retries(2);
         EventApi(pico_A[0][0],'a',"picolog").get('/reset')
         .set('Accept', 'application/json')
         .query({rids : picoLogs })
         .expect(200)
         .end(function(err,res){
          done();
        });
       });
        it('enables pico B logging', function(done) {
         this.retries(2);
         EventApi(pico_B[0][0],'b',"picolog").get('/reset')
         .set('Accept', 'application/json')
         .query({rids : picoLogs })
         .expect(200)
         .end(function(err,res){
          done();
        });
       });
        it('Pico A uninstall wrangler.prod('+wrangler_prod+') & bootstrapping.prod('+bootstrap_rid+')',function(done) {
         this.retries(2);
         EventApi(pico_A[0][0],'a').get('/uninstall_rulesets_requested')
         .set('Accept', 'application/json')
         .query({ rids : wrangler_prod+';'+bootstrap_rid })
         .expect(200)
         .end(function(err,res){
          done();
        });
       });
        it('compares updated list of installed rulesets in Pico A with wrangler.dev, fails if rulesets() is not working or if uninstall failed',function(done) {
         this.retries(2);
         childSkyQuery.get("/rulesets")
         .query({ _eci: pico_A[0][0] ,_eid: eid('a')})
         .expect(200)
         .end(function(err,res){
          response = res.text;
          response = JSON.parse(response);
          //assert.equal(true,second_response.status);
          assert.include(response.rids,wrangler_dev,wrangler_dev+'should be installed');
          assert.include(response.rids,picoLogs,picoLogs+'should be installed');
          assert.notInclude(response.rids,wrangler_prod,wrangler_prod+'(wrangler.prod) should not be installed in child pico');
          assert.notInclude(response.rids,bootstrap_rid,bootstrap_rid+'(bootstrapping.prod) should not be installed in child pico');
          if (err) { // does not work like it should.....
            console.log('installed rulesets in child:',response);
            throw err;
          }
          done();
        });
       });
        it('Pico B uninstall wrangler.prod('+wrangler_prod+') & bootstrapping.prod('+bootstrap_rid+')',function(done) {
         this.retries(2);
         EventApi(pico_B[0][0],'b').get('/uninstall_rulesets_requested')
         .set('Accept', 'application/json')
         .query({ rids : wrangler_prod+';'+bootstrap_rid })
         .expect(200)
         .end(function(err,res){
          done();
        });
       });/*
        it('compares updated list of installed rulesets in Pico B with wrangler.dev, fails if rulesets() is not working or if uninstall failed',function(done) {
         this.retries(2);
         childSkyQuery.get("/rulesets")
         .query({ _eci: pico_B[0][0] ,_eid: eid()})
         .expect(200)
         .end(function(err,res){
          response = res.text;
          response = JSON.parse(response);
          //assert.equal(true,second_response.status);
          assert.include(response.rids,wrangler_dev,wrangler_dev+'should be installed');
          assert.include(response.rids,picoLogs,picoLogs+'should be installed');
          assert.notInclude(response.rids,wrangler_prod,wrangler_prod+'(wrangler.prod) should not be installed in child pico');
          assert.notInclude(response.rids,bootstrap_rid,bootstrap_rid+'(bootstrapping.prod) should not be installed in child pico');
          if (err) { // does not work like it should.....
            console.log('installed rulesets in child:',response);
            throw err;
          }
          done();
        });
       });*/
        it('ensures Pico A logging is enabled',function(done) { // pico b should be ok if this passes 
         supertest("https://kibdev.kobj.net/sky/cloud/"+picoLogs).get("/loggingStatus")
         .query({ _eci: pico_A[0][0],_eid: eid('a')})
         .expect(200)
         .end(function(err,res){
          response = res.text;
          response = JSON.parse(response);
          assert.equal(true,response);
          done();
        });
       });


      });

      //  after( function(done) {
      //      EventApi(_eci).get('/child_deletion')
      //      .set('Accept', 'application/json')
      //      .query({deletionTarget : pico_A[0][0]})
      //     .expect(200)
      //      .expect('Content-Type', /json/)
      //      .end(function(err,res){
      //        done();
      //      });
      //    });

    });

// ********************************************************************************************
// ***                               Main Tests                                             ***
// ********************************************************************************************


      describe('Main Tests', function() {


// ********************************************************************************************
// ***                               Rulesets Management                                    ***
// ********************************************************************************************
      // registering rulesets ------> in devtools.krl
      //     -list registered -multiple & single 
      //     -register new ruleset
      //     -edit url 
      //     -flush
      //     -registered ruleset meta 
      //     -delete - remove, meta data check, install, remove again.
      // installing rulesets 
      //     -list installed ruleset
      //     -install new ruleset
      //     -uninstall ruleset
      
      describe('Rulesets Management', function() {
        describe('get ruleset meta', function() {
          it('update suite variable ',function(done) {
          _eid.suite = 'get ruleset meta';
          done();
          });

          it('rulesetsInfo('+wrangler_dev+ ') should return a single ruleset meta data',function(done){
            this.retries(2);
            childSkyQuery.get('/rulesetsInfo')
            .set('Accept', 'application/json')
            .query({ _eci: pico_A[0][0],_eid: eid('a'), rids: wrangler_dev})
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err,res){
              response = res.text;
              object_response = JSON.parse(response);
                //console.log("meta data",object_response)
                assert.equal(true,object_response.status);
                assert.property(object_response,"description",'return object should have a description.');
                assert.property(object_response.description,wrangler_dev,"Should have "+wrangler_dev+" meta data.");
                assert.include(object_response.description[wrangler_dev].description,"Wrangler","Should have the word wrangler in description.");
                done();
              });
          });

        //  it('rulesetsInfo([b507803x0.dev]) should return a single ruleset meta data',function(done){
        //    this.retries(2);
        //    childSkyQuery.get('/rulesetsInfo')
        //    .set('Accept', 'application/json')
        //    .query({ _eci: pico_A[0][0], rids: ['b507803x0.dev']})
        //    .expect(200)
        //    .expect('Content-Type', /json/)
        //    .end(function(err,res){
        //      response = res.text;
        //      object_response = JSON.parse(response);
        //      assert.equal(true,object_response.status);
        //      assert.property(object_response,"description",'return object should have a description.');
        //      assert.property(object_response.description,"b507803x0.dev","Should have b507803x0.dev meta data.");
        //      assert.include(object_response.description['b507803x0.dev'].description,"Wrangler","Should have the word wrangler in description.");
        //      done();
        //    });
        //  });

          it('rulesetsInfo('+testing_rid1+';' + wrangler_dev+') should return a multiple ruleset meta data',function(done){
            this.retries(2);
            childSkyQuery.get('/rulesetsInfo')
            .set('Accept', 'application/json')
            .query({ _eci: pico_A[0][0],_eid: eid('a'), rids: testing_rid1+";"+wrangler_dev})
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err,res){
              response = res.text;
              object_response = JSON.parse(response);
                //console.log("meta data",object_response)
                assert.equal(true,object_response.status);
                assert.property(object_response,"description",'return object should have a description.');
                assert.property(object_response.description,wrangler_dev,"Should have "+wrangler_dev +" meta data.");
                assert.property(object_response.description,testing_rid1,"Should have "+testing_rid1+" meta data.");
                assert.include(object_response.description[wrangler_dev].description,"Wrangler","Should have the word wrangler in description.");
                done();
              });
          });
        //  it('rulesetsInfo([b507706x12.dev,b507803x0.dev]) should return a multiple rulesets meta data',function(done){
        //    this.retries(2);
        //    childSkyQuery.get('/rulesetsInfo')
        //    .set('Accept', 'application/json')
        //    .query({ _eci: pico_A[0][0], rids: ['b507706x12.dev','b507803x0.dev']})
        //    .expect(200)
        //    .expect('Content-Type', /json/)
        //    .end(function(err,res){
        //      response = res.text;
        //      object_response = JSON.parse(response);
        //      console.log("meta data",object_response)
        //      assert.equal(true,object_response.status);
        //      assert.property(object_response,"description",'return object should have a description.');
        //      assert.property(object_response.description,"b507803x0.dev","Should have b507803x0.dev meta data.");
        //      assert.property(object_response.description,"b507706x12.dev","Should have b507706x12.dev meta data.");
        //      assert.include(object_response.description['b507803x0.dev'].description,"Wrangler","Should have the word wrangler in description.");
        //      done();
        //    });
        //  });
        });
      describe('install rulesets', function() {

        describe('install single rulesets', function() {

          var first_response;
          var second_response;

        it('update suite variable ',function(done) {
          _eid.suite = 'install single rulesets';
          done();
        });

          it('stores initial list to confirm installed ruleset',function(done) {
            childSkyQuery.get("/rulesets")
            .query({ _eci: pico_A[0][0],_eid: eid('a') })
            .expect(200)
            .end(function(err,res){
              response = res.text;
              first_response = JSON.parse(response);
              assert.equal(true,first_response.status);
              done();
            });
          });


          it('install ruleset', function(done) {
           EventApi(pico_A[0][0],'a').get('/install_rulesets_requested')
           .set('Accept', 'application/json')
           .query({rids :testing_rid1})
           .expect(200)
           .end(function(err,res){
              //assert.equal(true,res.status);
              done();
            });
         });
          it('stores list to confirm installed ruleset',function(done) {
           this.retries(2);
           childSkyQuery.get("/rulesets")
           .query({ _eci: pico_A[0][0],_eid: eid('a') })
           .expect(200)
           .end(function(err,res){
            response = res.text;
            second_response = JSON.parse(response);
            assert.equal(true,second_response.status);
            done();
          }); 
         });

          it('list should differ by one if new ruleset installed.', function() {
            var installed_rulesets = _.difference( second_response.rids, first_response.rids);

            if (((installed_rulesets.length) != 1 )){
              console.log("before install",first_response.rids);
              console.log("after install",second_response.rids);
              console.log("difference",installed_rulesets);
              if(((installed_rulesets.length) > 1 )){
                throw new Error("multiple new installed rulesets");
              }else{
                throw new Error("no new installed rulesets");
              }
            } 
            assert.include(installed_rulesets,testing_rid1,"should include "+testing_rid1); 
          });
        });
        describe('uninstall single rulesets', function() {
          it('update suite variable ',function(done) {
            _eid.suite = 'uninstall single rulesets';
            done();
          });
          it('stores initial list to confirm uninstalled rulesets',function(done){
            EventApi(pico_A[0][0],'a').get('/uninstall_rulesets_requested')
            .set('Accept', 'application/json')
            .query({rids : testing_rid1 })
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err,res){
              done();
            });
          });
          it("check list for uninstalled rulesets", function(done){
            childSkyQuery.get("/rulesets")
            .query({ _eci: pico_A[0][0],_eid: eid('a') })
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
              assert.notInclude(response.rids,testing_rid1,"installed rulesets should not be included "+testing_rid1);
              done();
            });
          });
        });


        describe('installing a multiple ruleset', function() {

          var first_response;
          var second_response;

          it('update suite variable ',function(done) {
            _eid.suite = 'installing a multiple ruleset';
            done();
          });

          it('stores initial list to confirm installed rulesets',function(done) {
            childSkyQuery.get("/rulesets")
            .query({ _eci: pico_A[0][0] ,_eid: eid('a')})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              first_response = JSON.parse(response);
              assert.equal(true,first_response.status);
              done();
            });
          });


          it('install rulesets', function(done) {
           EventApi(pico_A[0][0],'a').get('/install_rulesets_requested')
           .set('Accept', 'application/json')
           .query({rids : testing_rid1+';'+testing_rid2})
           .expect(200)
           .end(function(err,res){
              //assert.equal(true,res.status);
              done();
            });
         });
          it('stores list to confirm installed rulesets',function(done) {
           this.retries(2);
           childSkyQuery.get("/rulesets")
           .query({ _eci: pico_A[0][0],_eid: eid('a') })
           .expect(200)
           .end(function(err,res){
            response = res.text;
            second_response = JSON.parse(response);
            assert.equal(true,second_response.status);
            done();
          }); 
         });

          it('list should differ by two if new ruleset installed.', function() {
            var installed_rulesets = _.difference( second_response.rids, first_response.rids);
            if ((installed_rulesets.length) != 2 ){
              console.log("before install",first_response.rids);
              console.log("after install",second_response.rids);
              console.log("difference",installed_rulesets);
              if((installed_rulesets.length) > 2 ){
                throw new Error("more than 2 new installed rulesets");
              }else if((installed_rulesets.length) > 1){
                throw new Error("only one new installed rulesets");
              }else {
                throw new Error("no new installed rulesets");
              }
            }
            assert.include(installed_rulesets,testing_rid1,"should include "+testing_rid1); 
            assert.include(installed_rulesets,testing_rid2,"should include "+testing_rid2); 
          });
        });

        describe('uninstalling a multiple ruleset', function() {

          it('update suite variable ',function(done) {
            _eid.suite = 'uninstalling a multiple ruleset';
            done();
          });

          it('stores initial list to confirm uninstalled rulesets',function(done){
            EventApi(pico_A[0][0],'a').get('/uninstall_rulesets_requested')
            .set('Accept', 'application/json')
            .query({rids : testing_rid1+';'+testing_rid2 })
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err,res){
              done();
            });
          });
          it("check list for uninstalled rulesets", function(done){
            childSkyQuery.get("/rulesets")
            .query({ _eci: pico_A[0][0],_eid: eid('a') })
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
              assert.notInclude(response.rids,testing_rid1,"installed rulesets should not be included "+testing_rid1);
              assert.notInclude(response.rids,testing_rid2,"installed rulesets should not be included "+testing_rid2);
              done();
            });
          });
        });
      });

    });
    });

// ********************************************************************************************
// ***                               Channel Management                                     ***
// ********************************************************************************************
      //     
      // channel management
      //     -list channel - multiple & single 
      //     -create new channel
      //     -list channel type
      //     -list channel policy
      //     -list channel attributes
      //     -update channel type
      //     -update channel policy
      //     -update channel attributes 
      //     -remove channel
      describe('Channel Management', function() {
        var channel_for_testing1_cid_channel = {};
        var channel_for_testing3_cid_channel = {};

        describe('list channel, create channel, list channel and confirms creation', function() {
          var first_response;
          var second_response;
          it('update suite variable ',function(done) {
          _eid.suite = 'list channel, create channel, list channel and confirms creation';
            done();
          });

          it('stores initial list to confirm created channel',function(done) {
            childSkyQuery.get("/channel")
            .query({ _eci: pico_A[0][0],_eid: eid('a') })
            .expect(200)
            .end(function(err,res){
              response = res.text;
              first_response = JSON.parse(response);
              assert.equal(true,first_response.status);
              done();
            });
          });

          it('create channel', function(done) {
           EventApi(pico_A[0][0],'a').get('/channel_creation_requested')
           .set('Accept', 'application/json')
           .query(channel_for_testing1)
           .expect(200)
           .end(function(err,res){
            done();
          });
         });

          it('confirms created channel',function(done) {
           this.retries(2);
           childSkyQuery.get("/channel")
           .query({ _eci: pico_A[0][0],_eid: eid('a') })
           .expect(200)
           .end(function(err,res){
            response = res.text;
            second_response = JSON.parse(response);
            assert.equal(true,second_response.status);
            done();
          }); 
         });

          it('list should differ by one if new channel created.', function() {
            first_response = first_response.channels =="error" ? []: first_response.channels;
            second_response = second_response.channels =="error" ? []: second_response.channels;
            var first_response_cid = _.map(first_response, function(channel){ return channel.cid; });
            var second_response_cid = _.map(second_response, function(channel){ return channel.cid; });
            var new_channel_cid = _.difference( second_response_cid, first_response_cid  );
            var new_channels = _.filter(second_response, function(channel){ return channel.cid == new_channel_cid; });
          var new_channel =  new_channels[0];  //pico_A = new_channel;
          channel_for_testing1_cid_channel = new_channel;
          if (new_channels.length != 1){
            console.log("first_response:",first_response);
            console.log("second_response:",second_response);
            console.log("first_response mapped:",first_response_cid);
            console.log("second_response mapped:",second_response_cid);
            console.log("difference:",new_channel_cid);
            console.log("second_response filtered:",new_channels);
          } 
          assert.isAbove(new_channels.length,0,"no channels created");
          assert.isBelow(new_channels.length,2,"multiple channel created");
          assert.equal(1,new_channels.length,1);
              //assert.deepEqual(new_channel,channel_for_testing1,"should be the same has " + channel_for_testing1);
              assert.equal(channel_for_testing1.channel_name,new_channel.name);
              assert.equal(channel_for_testing1.channel_type,new_channel.type);
              assert.equal(channel_for_testing1.attributes,new_channel.attributes.channel_attributes);
              //console.log("new_channel",new_channel);
              assert.equal(policy_string1,new_channel.policy.policy);
            });
        });

// **********************************list channels*******************************************

        describe('list channels', function() {
          it('update suite variable ',function(done) {
           _eid.suite = 'list channels';
            done();
          });
          it('create channel with eci', function(done) {
            channel_for_testing2.eci = pico_A[0][0];
           EventApi(pico_A[0][0],'a').get('/channel_creation_requested')
           .set('Accept', 'application/json')
           .query(channel_for_testing2)
           .expect(200)
           .end(function(err,res){
            done();
          });
         });
          it('create channel', function(done) {
           EventApi(pico_A[0][0],'a').get('/channel_creation_requested')
           .set('Accept', 'application/json')
           .query(channel_for_testing3)
           .expect(200)
           .end(function(err,res){
            done();
          });
         });
          it('try to create duplicate channel', function(done) {
           EventApi(pico_A[0][0],'a').get('/channel_creation_requested')
           .set('Accept', 'application/json')
           .query(channel_for_testing3)
           .expect(200)
           .end(function(err,res){
            done();
          });
         });
          it('should return all channels ',function(done){
            childSkyQuery.get("/channel")
            .query({ _eci: pico_A[0][0],_eid: eid('a')})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
              //console.log("channel",response);
              expect(response.channels).to.be.an('array');
              assert.isAtLeast(response.channels.length,3,"should have at least 3 channels listed.");
              done();
            });
          });
          it('should return a single channel from name '+channel_for_testing3.channel_name,function(done){
            childSkyQuery.get("/channel")
            .query({ _eci: pico_A[0][0],_eid: eid('a'), id: channel_for_testing3.channel_name})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
              //console.log("channel",response);
              //console.log("logs",logs(pico_A[0][0],done));
              //assert.equal(1,response.channels.length,1); chould be type not length check
              channel_for_testing3_cid_channel = response.channels;
              expect(channel_for_testing3_cid_channel).to.be.an('object');
              assert.equal(channel_for_testing3.channel_name,response.channels.name);
              assert.equal(channel_for_testing3.channel_type,response.channels.type);
              assert.equal(channel_for_testing3.attributes,response.channels.attributes.channel_attributes);
              assert.equal(policy_string3,response.channels.policy.policy);
              done();
            });
          });
          it('should return a single channel from id ' + (channel_for_testing1_cid_channel.cid) ,function(done){
            childSkyQuery.get("/channel")
            .query({ _eci: pico_A[0][0],_eid: eid('a'), id : channel_for_testing1_cid_channel.cid})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
              //console.log("channel",response);
              //assert.equal(1,response.channels.length,1);
              assert.equal(channel_for_testing1.channel_name,response.channels.name);
              assert.equal(channel_for_testing1.channel_type,response.channels.type);
              assert.equal(channel_for_testing1.attributes,response.channels.attributes.channel_attributes);
              assert.equal(policy_string1,response.channels.policy.policy);
              done();
            });
          });
          it('should return a collection of channels from type' ,function(done){
            childSkyQuery.get("/channel")
            .query({ _eci: pico_A[0][0],_eid: eid('a'), collection : "type"})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
              //console.log("channel",response);
              collection = response.channels;
              expect(collection).to.include.keys('devlog');
              expect(collection).to.include.keys('PCI');
              expect(collection).to.include.keys('TestDriver');
              done();
            });
          });
          it('should return a collection of channels from type filtered on TestDriver' ,function(done){
            childSkyQuery.get("/channel")
            .query({ _eci: pico_A[0][0],_eid: eid('a'), collection : "type",filtered : 'TestDriver'})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
              //console.log("channel",response);
              collection = response.channels;
              //expect(collection).to.include('devlog');
              //expect(collection).to.include('PCI');
              expect(collection).to.be.an('array');
              done();
            });
          });
// **********************************channel attributes*******************************************
// 
        describe('channel attributes', function() {
          var channel_variable_results;

          it('update suite variable ',function(done) {
          _eid.suite = 'channel attributes';
            done();
          });
// ********************************** Type *******************************************
          it('get channel type',function(done){
            childSkyQuery.get("/channelType")
            .query({ _eci: pico_A[0][0],_eid: eid('a'),eci:channel_for_testing1_cid_channel.cid})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
              assert.equal(channel_for_testing1.channel_type,response.type);
              done();
            });
          });

          it('update channel type by eci', function(done) {
           EventApi(pico_A[0][0],'a').get('/update_channel_type_requested')
           .set('Accept', 'application/json')
           .query({channel_type:channel_for_testing3.channel_type,eci:channel_for_testing1_cid_channel.cid})
           .expect(200)
           .end(function(err,res){
            done();
          });
         });

          it('confirm updated channel type by eci ',function(done){
            childSkyQuery.get("/channelType")
            .query({ _eci: pico_A[0][0],_eid: eid('a'),eci:channel_for_testing1_cid_channel.cid})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
              assert.equal(channel_for_testing3.channel_type,response.type);
              done();
            });
          });

          it('update channel type by name', function(done) {
           EventApi(pico_A[0][0],'a').get('/update_channel_type_requested')
           .set('Accept', 'application/json')
           .query({channel_type:channel_for_testing1.channel_type, name: (channel_for_testing1_cid_channel.name) })
           .expect(200)
           .end(function(err,res){
            done();
          });
         });

        it('confirm updated channel type by name',function(done){
            childSkyQuery.get("/channelType")
            .query({ _eci: pico_A[0][0],_eid: eid('a'),name:channel_for_testing1_cid_channel.name})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
              assert.equal(channel_for_testing1.channel_type,response.type);
              done();
            });
          });

// ********************************** Policy *******************************************

           it('get channel policy ',function(done){
            childSkyQuery.get("/channelPolicy")
            .query({ _eci: pico_A[0][0],_eid: eid('a'),eci:channel_for_testing1_cid_channel.cid})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
              assert.equal(policy_string1,response.policy.policy);
              done();
            });
          });
          it('update channel policy by eci', function(done) {
           EventApi(pico_A[0][0],'a').get('/update_channel_policy_requested')
           .set('Accept', 'application/json')
           .query({policy:channel_for_testing3.policy,eci:channel_for_testing1_cid_channel.cid})
           .expect(200)
           .end(function(err,res){
            done();
          });
         });
          it('confirm updated channel policy by eci',function(done){
            childSkyQuery.get("/channelPolicy")
            .query({ _eci: pico_A[0][0],_eid: eid('a'),eci:channel_for_testing1_cid_channel.cid})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
              assert.equal(policy_string3,response.policy.policy);
              done();
            });
          });

          it('update channel policy by name', function(done) {
           EventApi(pico_A[0][0],'a').get('/update_channel_policy_requested')
           .set('Accept', 'application/json')
           .query({policy:channel_for_testing1.policy,name:channel_for_testing1_cid_channel.name})
           .expect(200)
           .end(function(err,res){
            done();
          });
         });

          it('confirm updated channel policy by name',function(done){
            childSkyQuery.get("/channelPolicy")
            .query({ _eci: pico_A[0][0],_eid: eid('a'),name:channel_for_testing1_cid_channel.name})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
              assert.equal(policy_string1,response.policy.policy);
              done();
            });
          });

// ********************************** Attributes *******************************************

          it('get channel attributes',function(done){
            childSkyQuery.get("/channelAttributes")
            .query({ _eci: pico_A[0][0],_eid: eid('a'),eci:channel_for_testing1_cid_channel.cid})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
              assert.equal(channel_for_testing1.attributes,response.attributes.channel_attributes);
              done();
            });
          });
          it('update channel attributes by eci', function(done) {
           EventApi(pico_A[0][0],'a').get('/update_channel_attributes_requested')
           .set('Accept', 'application/json')
           .query({attributes:channel_for_testing3.attributes,eci:channel_for_testing1_cid_channel.cid})
           .expect(200)
           .end(function(err,res){
            done();
          });
         });
          it('confirm updated channel attributes by eci',function(done){
            childSkyQuery.get("/channelAttributes")
            .query({ _eci: pico_A[0][0],_eid: eid('a'),eci:channel_for_testing1_cid_channel.cid})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
              assert.equal(channel_for_testing3.attributes,response.attributes.channel_attributes);
              done();
            });
          });
          it('update channel attributes by name', function(done) {
           EventApi(pico_A[0][0],'a').get('/update_channel_attributes_requested')
           .set('Accept', 'application/json')
           .query({attributes:channel_for_testing1.attributes,name:channel_for_testing1_cid_channel.name})
           .expect(200)
           .end(function(err,res){
            done();
          });
         });
          it('confirm updated channel attributes by name',function(done){
            childSkyQuery.get("/channelAttributes")
            .query({ _eci: pico_A[0][0],_eid: eid('a'),name:channel_for_testing1_cid_channel.name})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
              assert.equal(channel_for_testing1.attributes,response.attributes.channel_attributes);
              done();
            });
          });

// ********************************** Delete *******************************************

        it('delete channel with ID '+channel_for_testing1_cid_channel.cid, function(done) {
           EventApi(pico_A[0][0],'a').get('/channel_deletion_requested')
           .set('Accept', 'application/json')
           .query({eci : channel_for_testing1_cid_channel.cid})
           .expect(200)
           .end(function(err,res){
            done();
          });
         });

        it('confirm channel deleted with ID '+channel_for_testing1_cid_channel.cid,function(done){
            childSkyQuery.get("/channel")
            .query({ _eci: pico_A[0][0],_eid: eid('a'), id: channel_for_testing1_cid_channel.cid})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              //assert.equal({},response.channels);
              expect((response.channels)).to.be.empty;
              //assert(response.channels.name).to.not.exist;
              done();
            });
          });

        it('delete channel with name '+channel_for_testing3.channel_name, function(done) {
           EventApi(pico_A[0][0],'a').get('/channel_deletion_requested')
           .set('Accept', 'application/json')
           .query({name: channel_for_testing3.channel_name})
           .expect(200)
           .end(function(err,res){
            done();
          });
         });

        it('confirm channel deleted with name '+channel_for_testing3_cid_channel.name,function(done){
            childSkyQuery.get("/channel")
            .query({ _eci: pico_A[0][0],_eid: eid('a'), id: channel_for_testing3_cid_channel.name})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              expect(response.channels).to.be.empty;
              //assert.equal({},response.channels);
              //assert(response.channels.name).to.not.exist;
              done();
            });
          });

        });
        });
      });   
      
// ********************************************************************************************
// ***                               subscriptions Management                               ***
// ********************************************************************************************

      // subscriptions 
      //     -list subscriptions - all & by collection & by filtered collection 
      //     -eci from name - not sure how yet!!!!!!!
      //     -subscriptions attributes. 
      describe('Subscriptions Management', function() {
        var testing1_subscription = {};
        var testing2_subscription = {};
        var Pico_A_first_response;
        var Pico_B_first_response;
        var Pico_A_second_response;
        var Pico_B_second_response;
        describe('list subscriptions, create subscriptions, list subscriptions and confirms creation', function() {
          it('update suite variable ',function(done) {
          _eid.suite = 'list subscriptions, create subscriptions, list subscriptions and confirms creation';
            done();
          });

          it('stores initial list in Pico_A to confirm created pending subscription',function(done) {
            childSkyQuery.get("/subscriptions")
            .query({ _eci: pico_A[0][0],_eid: eid('a') })
            .expect(200)
            .end(function(err,res){
              response = res.text;
              Pico_A_first_response = JSON.parse(response);
              assert.equal(true,Pico_A_first_response.status);
              done();
            });
          });

          it('stores initial list in Pico_B to confirm created pending subscription',function(done) {
            childSkyQuery.get("/subscriptions")
            .query({ _eci: pico_B[0][0],_eid: eid('b') })
            .expect(200)
            .end(function(err,res){
              response = res.text;
              Pico_B_first_response = JSON.parse(response);
              assert.equal(true,Pico_B_first_response.status);
              done();
            });
          });

          it('create subscriptions from Pico_A', function(done) {
           EventApi(pico_A[0][0],'a').get('/subscription')
           .set('Accept', 'application/json')
           .query({
            name: subscriptions_for_testing1.name,
            name_space: subscriptions_for_testing1.name_space,
            my_role: subscriptions_for_testing1.my_role,
            subscriber_role: subscriptions_for_testing1.subscriber_role,
            subscriber_eci : pico_B[0][0],
            channel_type: subscriptions_for_testing1.channel_type,
            attrs: subscriptions_for_testing1.attrs
           }) // subscription request to parent 
           .expect(200)
           .end(function(err,res){
              setTimeout(function() { // let pico B handle subscription event. 
                done();
              }, 6000);
          });
         });

      //  it('should delay for pico_B to handle inbound subscription', function(done){
      //    assert.equal(true,true,true);
      //    this.timeout(600);
      //    setTimeout(done, 600);
      //  });

        this.timeout(50000);


          it('stores subscriptions to confirm created Outbound subscription request in Pico_A',function(done) {
           this.retries(2);
           childSkyQuery.get("/subscriptions")
           .query({ _eci: pico_A[0][0],_eid: eid('a') })
           .expect(200)
           .end(function(err,res){
            response = res.text;
            Pico_A_second_response = JSON.parse(response);
           // console.log("second_response :", Pico_A_second_response);
            assert.equal(true, Pico_A_second_response.status);
            done();
          }); 
         });

          it('list should differ by one if new subscription request created.', function() {
            first_response = Pico_A_first_response.subscriptions =="error" ? []: _.map(Pico_A_first_response.subscriptions,function(subscription){ return _.values(subscription)[0];});
            second_response = Pico_A_second_response.subscriptions =="error" ? []: _.map(Pico_A_second_response.subscriptions,function(subscription){ return _.values(subscription)[0];});
            var first_response_cid = _.map(first_response, function(subscription){ return subscription.inbound_eci; });
            var second_response_cid = _.map(second_response, function(subscription){ return subscription.inbound_eci; });
            var new_subscription_cid = _.difference( second_response_cid, first_response_cid  );
            var new_subscriptions = _.filter(second_response, function(subscription){ return subscription.inbound_eci == new_subscription_cid; });
          var new_subscription =  new_subscriptions[0];  
         // console.log("new_subscription :", new_subscription);
          testing1_subscription = new_subscription;
          if (new_subscriptions.length != 1){
            console.log("first_response:",first_response);
            console.log("second_response:",second_response);
            console.log("first_response mapped:",first_response_cid);
            console.log("second_response mapped:",second_response_cid);
            console.log("difference:",new_subscription_cid);
            console.log("second_response filtered:",new_subscription);
          } 
          assert.isAbove(new_subscriptions.length,0,"no subscription created");
          assert.isBelow(new_subscriptions.length,2,"multiple subscriptions created");
          assert.equal(1,new_subscriptions.length,1);
          assert.equal(new_subscription.status,"outbound");
          assert.equal(new_subscription.name_space,subscriptions_for_testing1.name_space);
          assert.equal(new_subscription.subscriber_eci,pico_B[0][0]);
          assert.equal(new_subscription.my_role,subscriptions_for_testing1.my_role);
          assert.equal(new_subscription.subscription_name,subscriptions_for_testing1.name);
          assert.equal(new_subscription.attributes,subscriptions_for_testing1.attrs);

          });

          it('stores subscriptions to confirm created Inbound subscription request in Pico_B',function(done) {
           childSkyQuery.get("/subscriptions")
           .query({ _eci: pico_B[0][0],_eid: eid('b') })
           .expect(200)
           .end(function(err,res){
            response = res.text;
            Pico_B_second_response = JSON.parse(response);
            assert.equal(true, Pico_A_second_response.status);
             done();
          }); 
         });

          it('list should differ by one if new subscription request created.', function() {
         // console.log("second_response :", Pico_B_second_response);
            first_response = Pico_B_first_response.subscriptions =="error" ? []: _.map(Pico_B_first_response.subscriptions,function(subscription){ return _.values(subscription)[0];});
            second_response = Pico_B_second_response.subscriptions =="error" ? []: _.map(Pico_B_second_response.subscriptions,function(subscription){ return _.values(subscription)[0];});
            var first_response_cid = _.map(first_response, function(subscription){ return subscription.inbound_eci; });
            var second_response_cid = _.map(second_response, function(subscription){ return subscription.inbound_eci; });
            var new_subscription_cid = _.difference( second_response_cid, first_response_cid  );
            var new_subscriptions = _.filter(second_response, function(subscription){ return subscription.inbound_eci == new_subscription_cid; });
          var new_subscription =  new_subscriptions[0];  
         // console.log("new_subscription :", new_subscription);
          testing2_subscription = new_subscription;
          if (new_subscriptions.length != 1){
            console.log("first_response:",first_response);
            console.log("second_response:",second_response);
            console.log("first_response mapped:",first_response_cid);
            console.log("second_response mapped:",second_response_cid);
            console.log("difference:",new_subscription_cid);
            console.log("second_response filtered:",new_subscription);
          } 
          assert.isAbove(new_subscriptions.length,0,"no channels created");
          assert.isBelow(new_subscriptions.length,2,"multiple channel created");
          assert.equal(1,new_subscriptions.length,1);
          assert.equal(new_subscription.status,"inbound");
          assert.equal(new_subscription.name_space,subscriptions_for_testing1.name_space);
          assert.equal(new_subscription.outbound_eci,testing1_subscription.inbound_eci);
          //assert.equal(testing2_subscription.inbound_eci,testing1_subscription.outbound_eci);
          assert.equal(new_subscription.my_role,subscriptions_for_testing1.subscriber_role);
          assert.equal(new_subscription.subscription_name,subscriptions_for_testing1.name);
          assert.equal(new_subscription.attributes,subscriptions_for_testing1.attrs);
            });

        });

// ********************************** Accept Inbound subscription *******************************************

        describe('Accept Inbound subscription',function(done){

          it('update suite variable ',function(done) {
          _eid.suite = 'Accept Inbound subscription';
            done();
          });

//          it('should return all channels ',function(done){
//            childSkyQuery.get("/channel")
//            .query({ _eci: pico_A[0][0],_eid: eid('a')})
//            .expect(200)
//            .end(function(err,res){
//              response = res.text;
//              response = JSON.parse(response);
//              assert.equal(true,response.status);
//              console.log("channel",JSON.stringify(response));
//              expect(response.channels).to.be.an('array');
//              assert.isAtLeast(response.channels.length,3,"should have at least 3 channels listed.");
//              done();
//            });
//          });

          it('Accept Inbound Subscription in pico_B',function(done){
          name = testing2_subscription.channel_name;
          //console.log('name : ',name);
          EventApi(pico_B[0][0],'b').get('/pending_subscription_approval')
           .set('Accept', 'application/json')
           .query({
            channel_name : name
           }) 
           .expect(200)
           .end(function(err,res){
              setTimeout(function() { // let pico A handle subscription event. 
                done();
              }, 6000);
            });
          });
          it('stores subscriptions to confirm created accepted subscription request in Pico_B',function(done) {
           Pico_B_first_response = Pico_B_second_response;
           childSkyQuery.get("/subscriptions")
           .query({ _eci: pico_B[0][0],_eid: eid('b') })
           .expect(200)
           .end(function(err,res){
            response = res.text;
            Pico_B_second_response = JSON.parse(response);
            assert.equal(true, Pico_A_second_response.status);
            subscription =  _.values(Pico_B_second_response.subscriptions[0])[0];
            //console.log("subscription",subscription);
            assert.equal(subscription.status,'subscribed');
                          setTimeout(function() { // let pico A handle subscription event. 
                done();
              }, 6000);
          }); 
         });
          it('stores subscriptions to confirm created accepted subscription request in Pico_A',function(done) {
           Pico_A_first_response = Pico_A_second_response;
           consoleLogEid = eid('a');
           childSkyQuery.get("/subscriptions")
           .query({ _eci: pico_A[0][0],_eid: consoleLogEid })
           .expect(200)
           .end(function(err,res){
            response = res.text;
           // console.log("subscriptions ",response);

            Pico_A_second_response = JSON.parse(response);

            assert.equal(true, Pico_A_second_response.status);
            subscription =  _.values(Pico_A_second_response.subscriptions[0])[0];
          //  console.log("subscription",subscription);
         //   console.log("eid",consoleLogEid);
            
            assert.equal(subscription.status,'subscribed');
                          setTimeout(function() { // let pico A handle subscription event. 
                done();
              }, 6000);
          }); 
         });
        });
// ********************************** list subscription *******************************************

        describe('list subscription',function(done){

          it('update suite variable ',function(done) {
          _eid.suite = 'list subscription';
            done();
          });

        it('create subscriptions from Pico_A', function(done) {
           EventApi(pico_A[0][0],'a').get('/subscription')
           .set('Accept', 'application/json')
           .query({
            name: subscriptions_for_testing1.name,
            name_space: subscriptions_for_testing1.name_space,
            my_role: subscriptions_for_testing1.my_role,
            subscriber_role: subscriptions_for_testing1.subscriber_role,
            subscriber_eci : pico_B[0][0],
            channel_type: subscriptions_for_testing1.channel_type,
            attrs: subscriptions_for_testing1.attrs
           }) // subscription request to parent 
           .expect(200)
           .end(function(err,res){
              setTimeout(function() { // let pico B handle subscription event. 
                done();
              }, 6000);
          });
         });
        this.timeout(50000);

          it('should return all subscriptions',function(done){
            childSkyQuery.get("/subscriptions")
            .query({ _eci: pico_A[0][0],_eid: eid('a')})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
              console.log(" return all subscriptions",response);
              expect(response.subscriptions).to.be.an('array');
              assert.isAtLeast(response.subscriptions.length,2,"should have at least 2 subscriptions listed.");
              done();
            });
          });
          it('should return a single subscription from channel name, ',function(done){
            childSkyQuery.get("/subscriptions")
            .query({ _eci: pico_A[0][0],_eid: eid('a'), id: testing1_subscription.channel_name})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
              console.log("single subscription from channel name",response);
              subscription = response.subscriptions;
              expect(subscription).to.be.an('object');
              name = testing1_subscription.channel_name;
              assert.equal(testing1_subscription.channel_name,subscription[name].channel_name);
              done();
            });
          });
          /*
          it('should return a single subscription from subscription name, ',function(done){
            childSkyQuery.get("/checkSubscriptionName")
            .query({ _eci: pico_A[0][0],_eid: eid('a'), name: testing1_subscription.subscription_name})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              console.log("single subscription from subscription name",response);
              response = JSON.parse(response);
              console.log("single subscription from subscription name",response);
              //assert.equal(true,response.status);
              subscription = response.subscriptions;
              //expect(subscription).to.be.an('object');
              //assert.equal(testing1_subscription.channel_name,subscription[testing1_subscription.channel_name].channel_name);
              done();
            });
          });
          it('should return a single subscription from subscription name, ',function(done){
            childSkyQuery.get("/checkSubscriptionName")
            .query({ _eci: pico_A[0][0],_eid: eid('a'), name: "adam"})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              console.log("single subscription from subscription name",response);
              subscription = response.subscriptions;
              //expect(subscription).to.be.an('object');
              //assert.equal(testing1_subscription.channel_name,subscription[testing1_subscription.channel_name].channel_name);
              done();
            });
          });
          */
          it('should return a single subscription from eci as id',function(done){
            childSkyQuery.get("/subscriptions")
            .query({ _eci: pico_A[0][0],_eid: eid('a'), id : testing1_subscription.inbound_eci})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
              //console.log("single subscription from eci as id",response);
              subscription = response.subscriptions;
              expect(subscription).to.be.an('object');
              assert.equal(testing1_subscription.channel_name,subscription[testing1_subscription.channel_name].channel_name);
              done();
            });
          });
          it('should return a collection of subscriptions from status' ,function(done){
            childSkyQuery.get("/subscriptions")
            .query({ _eci: pico_A[0][0],_eid: eid('a'), collection : "status"})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
              //console.log("collection of subscriptions from status",response);
              collection = response.subscriptions;
              expect(collection).to.include.keys('outbound');
              expect(collection).to.include.keys('subscribed');
              expect(subscription).to.be.an('object');
              done();
            });
          });
          it('should return a collection of subscriptions from channel_name filtered on channel_name' ,function(done){
            childSkyQuery.get("/subscriptions")
            .query({ _eci: pico_A[0][0],_eid: eid('a'), collection : "channel_name",filtered : testing1_subscription.channel_name})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
              //console.log("should return a collection of subscriptions from channel_name filtered on channel_name",response);
              collection = response.subscriptions;
              expect(collection).to.be.an('array');
              assert.equal(1,collection.length,1);
              expect(collection[0]).to.include.keys(testing1_subscription.channel_name);
              done();
            });
          });


});
// ********************************** remove subscription *******************************************
        describe('remove subscription',function(done){
          var subscriptions_to_remove={};
          it('update suite variable ',function(done) {
          _eid.suite = 'remove subscription';
            done();
          });

          it('should store outbound channel_name' ,function(done){
            childSkyQuery.get("/subscriptions")
            .query({ _eci: pico_A[0][0],_eid: eid('a'), collection : "status",filtered : "outbound"})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
             // console.log("should return a collection of subscriptions ",response);
              collection = response.subscriptions;
              expect(collection).to.be.an('array');
              assert.equal(1,collection.length,1);
              subscriptions_to_remove = _.values(collection[0])[0];
              done();
            });
          });

        it('remove subscribed subscription from Pico_A and Pico_B', function(done) {
           EventApi(pico_A[0][0],'a').get('/subscription_cancellation')
           .set('Accept', 'application/json')
           .query({
                    channel_name: testing1_subscription.channel_name
                  }) // subscription request to parent 
           .expect(200)
           .end(function(err,res){
              setTimeout(function() { // let pico B handle subscription event. 
                done();
              }, 6000);
          });
         });

          it('confirm removal by returning a collection of subscriptions from status Pico_A' ,function(done){
            childSkyQuery.get("/subscriptions")
            .query({ _eci: pico_A[0][0],_eid: eid('a'), collection : "status"})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
            //  console.log("collection of subscriptions from status",response);
              collection = response.subscriptions;
              expect(collection).not.to.include.keys('subscribed');
              expect(collection).to.include.keys('outbound');
              expect(subscription).to.be.an('object');
              done();
            });
          });

          it('confirm removal by returning a collection of subscriptions from status Pico_B' ,function(done){
            childSkyQuery.get("/subscriptions")
            .query({ _eci: pico_B[0][0],_eid: eid('b'), collection : "status"})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
           //   console.log("collection of subscriptions from status",response);
              collection = response.subscriptions;
              expect(collection).not.to.include.keys('subscribed');
              expect(collection).to.include.keys('inbound');
              expect(subscription).to.be.an('object');
              done();
            });
          });

          it('remove outbound subscription from Pico_A and inbound from Pico_B', function(done) {
           EventApi(pico_A[0][0],'a').get('/outbound_subscription_cancellation')
           .set('Accept', 'application/json')
           .query({
                    channel_name: subscriptions_to_remove.channel_name
                  }) // subscription request to parent 
           .expect(200)
           .end(function(err,res){
              setTimeout(function() { // let pico B handle subscription event. 
                done();
              }, 6000);
          });
         });

          it('confirm removal by returning a collection of subscriptions from status Pico_A' ,function(done){
            childSkyQuery.get("/subscriptions")
            .query({ _eci: pico_A[0][0],_eid: eid('a'), collection : "status"})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
            //  console.log("collection of subscriptions from status Pico_A",response);
              collection = response.subscriptions;
              expect(collection).not.to.include.keys('subscribed');
              expect(collection).not.to.include.keys('outbound');
              expect(subscription).to.be.an('object');
              done();
            });
          });

          it('confirm removal by returning a collection of subscriptions from status Pico_B' ,function(done){
            childSkyQuery.get("/subscriptions")
            .query({ _eci: pico_B[0][0],_eid: eid('b'), collection : "status"})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
           //   console.log("collection of subscriptions from status Pico_B",response);
              collection = response.subscriptions;
              expect(collection).not.to.include.keys('subscribed');
              expect(collection).not.to.include.keys('inbound');
              expect(subscription).to.be.an('object');
              done();
            });
          });


          it('create subscriptions from Pico_A', function(done) {
             EventApi(pico_A[0][0],'a').get('/subscription')
             .set('Accept', 'application/json')
             .query({
              name: subscriptions_for_testing1.name,
              name_space: subscriptions_for_testing1.name_space,
              my_role: subscriptions_for_testing1.my_role,
              subscriber_role: subscriptions_for_testing1.subscriber_role,
              subscriber_eci : pico_B[0][0],
              channel_type: subscriptions_for_testing1.channel_type,
              attrs: subscriptions_for_testing1.attrs
             }) // subscription request to parent 
             .expect(200)
             .end(function(err,res){
                setTimeout(function() { // let pico B handle subscription event. 
                  done();
                }, 6000);
            });
           });
          this.timeout(50000);

          it('should store outbound channel_name' ,function(done){
            childSkyQuery.get("/subscriptions")
            .query({ _eci: pico_B[0][0],_eid: eid('b'), collection : "status",filtered : "inbound"})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
           //   console.log("should return a collection of subscriptions ",response);
              collection = response.subscriptions;
              expect(collection).to.be.an('array');
              assert.equal(1,collection.length,1);
              subscriptions_to_remove = _.values(collection[0])[0];
              done();
            });
          });

          it('remove inbound subscription from Pico_B and outbound from Pico_A', function(done) {
           //console.log("name",subscriptions_to_remove.channel_name);
           EventApi(pico_B[0][0],'b').get('/inbound_subscription_rejection')
           .set('Accept', 'application/json')
           .query({
                    channel_name: subscriptions_to_remove.channel_name
                  }) // subscription request to parent 
           .expect(200)
           .end(function(err,res){
              setTimeout(function() { // let pico B handle subscription event. 
                done();
              }, 6000);
          });
         });

          it('confirm removal by returning a collection of subscriptions from status Pico_A' ,function(done){
            childSkyQuery.get("/subscriptions")
            .query({ _eci: pico_A[0][0],_eid: eid('a'), collection : "status"})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
            //  console.log("collection of subscriptions from status Pico_A",response.subscriptions.outbound);
              collection = response.subscriptions;
              expect(collection).not.to.include.keys('subscribed');
              expect(collection).not.to.include.keys('outbound');
              expect(subscription).to.be.an('object');
              done();
            });
          });

          it('confirm removal by returning a collection of subscriptions from status Pico_B' ,function(done){
            childSkyQuery.get("/subscriptions")
            .query({ _eci: pico_B[0][0],_eid: eid('b'), collection : "status"})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
            //  console.log("collection of subscriptions from status Pico_B",response.subscriptions.inbound);
              collection = response.subscriptions;
              expect(collection).not.to.include.keys('subscribed');
              expect(collection).not.to.include.keys('inbound');
              expect(subscription).to.be.an('object');
              done();
            });
          });

        });
});







// ********************************************************************************************
// ***                               Scheduled events                                       ***
// ********************************************************************************************

      // scheduled events 
      //     -list scheduled
      //     -schedule
      //     -raised scheduled? - using logs???

// ********************************************************************************************
// ***                               Client Manager                                         ***
// ********************************************************************************************

      // client Manager
      //     -add client
      //     -update client info
      //     -remove client 

// ********************************************************************************************
// ***                               Prototypes management                                  ***
// ********************************************************************************************

      // prototypes management 
      //     -list prototypes
      //     -add prototypes
      //     -update prototypes
      describe('Prototypes Management', function() {

        describe('list/modify prototypes', function() {
          it('update suite variable ',function(done) {
          _eid.suite = 'list/modify prototypes';
            done();
          });

          it('should list default prototypes' ,function(done){
            childSkyQuery.get("/prototypes")
            .query({ _eci: pico_A[0][0],_eid: eid('a'), collection : "status"})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
              console.log("default prototypes",JSON.stringify(response));
             // collection = response.subscriptions;
             // expect(collection).not.to.include.keys('subscribed');
             // expect(collection).not.to.include.keys('outbound');
             // expect(subscription).to.be.an('object');
              done();
            });
          });
          it('should add a prototype');
          it('should update a prototype');
      });
// ********************************************************************************************
// ***                               Pico Creation With Prototypes                          ***
// ********************************************************************************************

      // pico creation from prototypes
      //     -no name given & no prototype given - name defaults to random unique name, prototype to core. 
      //     -name given & no prototype given
      //     -name given & prototype given
      //     -broken prototype // does it matter??
        describe('Pico Creation With Prototypes', function() {
          var first_response;
          var second_response;
          var new_pico;
          var prototype_one ={};

          it('update suite variable ',function(done) {
          _eid.suite = 'Pico Creation With Prototypes';
            done();
          });

        it("stores list of current children",function(done) {
          childSkyQuery.get("/children")
          .set('Accept', 'application/json')
          .query({ _eci: pico_A[0][0],_eid: eid('a')})
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err,res){
            response = res.text;
            first_response = JSON.parse(response);
          //  console.log("first_response: ",first_response);
            done();
          });
        });
        // create child
        it('create child pico with name and no prototype', function(done) {
           EventApi(pico_A[0][0],'a').get('/child_creation')
          .set('Accept', 'application/json')
          .query({ name: 'prototype_one' })
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err,res){
            setTimeout(function() { // let pico B handle subscription event. 
              done();
            }, 24000);
         });
        }); 
        it('store updated children picos',function(done) {
          childSkyQuery.get("/children")
          .set('Accept', 'application/json')
          .query({ _eci: pico_A[0][0],_eid: eid('a')})
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err,res){
            response = res.text;
            second_response = JSON.parse(response);
          //  console.log("second_response: ",second_response);
            done();
          });
        });
        it('compares updated list of picos to confirm successful creation, stores prototype_one eci for testing', function() {
          first_results = first_response.children =="error" ? []: first_response.children;
          second_results = second_response.children =="error" ? []: second_response.children;
          var first_response_ecis = _.map(first_results, function(child){ return child[0]; });
          var second_response_ecis = _.map(second_results, function(child){ return child[0]; });
          var new_Pico_eci = _.difference( second_response_ecis, first_response_ecis  );
          new_pico = _.filter(second_results, function(eci){ return eci[0] == new_Pico_eci; });
          prototype_one = new_pico;
         // console.log("prototype_one",prototype_one);
          if (((prototype_one.length) != 1 )){
            console.log("first_response:");
            console.log(first_results);
            console.log("second_response:");
            console.log(second_results);
            console.log("first_response mapped:");
            console.log(first_response_ecis);
            console.log("second_response mapped:");
            console.log(second_response_ecis);
            console.log("difference:");
            console.log(new_Pico_eci);
            console.log("second_response filtered:");
            console.log(prototype_one);
            console.log(prototype_one[0][0]);
            if(((prototype_one.length) > 1 )){
              throw new Error("multiple new installed rulesets");
            }else{
              throw new Error("no new installed rulesets");
            }

          }
        });

          it('confirms base ProtoType channels creation',function(done){
            childSkyQuery.get("/channel")
            .query({ _eci: prototype_one[0][0],_eid: eid('P'),collection : "type"})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
              console.log("channel",JSON.stringify(response));
              expect(response.channels).to.be.an('object');
              assert.isAtLeast(response.channels.ProtoType.length,2,"should have at least 2 channels listed.");
              prototype_channels = response.channels.ProtoType;
              even = _.find(prototype_channels, function(channel){ return channel.name == 'testPrototypChannel'; }); 
              assert.equal(even.name,'testPrototypChannel');
              even = _.find(prototype_channels, function(channel){ return channel.name == 'test2PrototypChannel'; }); 
              assert.equal(even.name,'test2PrototypChannel');
              done();
            });
          });
 

        it('confirms devtools(default) ProtoType channels creation',function(done){
            childSkyQuery.get("/channel")
            .query({ _eci: prototype_one[0][0],_eid: eid('P'),collection : "type"})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
              //console.log("channel",JSON.stringify(response));
              expect(response.channels).to.be.an('object');
              assert.isAtLeast(response.channels.ProtoType.length,2,"should have at least 2 channels listed.");
              prototype_channels = response.channels.ProtoType;
              even = _.find(prototype_channels, function(channel){ return channel.name == 'testDevtoolsPrototypChannel'; }); 
              assert.equal(even.name,'testDevtoolsPrototypChannel');
              even = _.find(prototype_channels, function(channel){ return channel.name == 'testDevtools2PrototypChannel'; }); 
              assert.equal(even.name,'testDevtools2PrototypChannel');
              done();
            });
          });


           it('confirms base prototype subscription creation, ',function(done){
            childSkyQuery.get("/subscriptions")
            .query({ _eci: pico_A[0][0],_eid: eid('P'), id : "basePrototypeName"})
            .expect(200)
            .end(function(err,res){
              response = res.text;
              response = JSON.parse(response);
              assert.equal(true,response.status);
              console.log("single subscription from subscription name",JSON.stringify(response));
              subscription = response.subscriptions;
              expect(subscription).to.be.an('object');
              values = _.values(subscription);
              assert.equal(values.subscription_name,'basePrototypeName');
              done();
            });
          });
  });



});


// ********************************************************************************************
// ***                               Clean UP                                               ***
// ********************************************************************************************

      describe('Logs',function(done){

        // need to have logs from parent 
        // need to have logs from pico B
        it('update suite variable ',function(done) {
          _eid.suite = 'Logs';
            done();
        });
          
        it('store logs eid for A',function(done){
        //var eids = _log_eid.join(';');
        logs = eidLogs.Logs();
        //console.log("list to get ", logs);
      //  console.log("list to get ", logs[0]);
        var eids =[]; 

        for (var i = 0; i < logs.length; i++) { // suite
            var value;
            for(var key in logs[i]) { // only loop once on suite key 
              value = logs[i][key]; // get values 
            }
     //   console.log("Log ", logs[i]);
     //   console.log("values ", value);

            eids = eids.concat(value.A);
        }
      //  console.log("eids  ", eids);
        eids = eids.join(";");
       // console.log("eids  ", eids);
        supertest("https://kibdev.kobj.net/sky/cloud/"+picoLogs).get("/getLogs")
          .query({ _eci: pico_A[0][0],_eid: eid('a'),eids:eids})
          .expect(200)
          .end(function(err,res){
            response = res.text;
            response = JSON.parse(response);
            //var response_eids = _.map(response, function(log){ return log.; });

          //  response = _.filter(response, function(log){ 
             // console.log("logs",response);
             // console.log("contains check.",_.contains(_log_eid,log.eid));
              //return _.contains(_log_eid,log.eid);});
            //console.log("logs of failed operations",response);
            for (var i = 0; i < response.length; i++) {
              for (var k = 0; k < response[i].log_items.length; k++) {
                response[i].log_items[k] = _.rest(response[i].log_items[k].split(/\s+/),5); // cut off extra first 6 columns 
                response[i].log_items[k] = response[i].log_items[k].join(' '); // join last columns back together 
                //console.log("shortened ",response[i].log_items[k]);
              }
            }
            //console.log("logs of failed operations",response);
            if ( response.length > 0){
              console.log("failed logs on Pico_A operations",response);
            }
            done();
          });
        });
      /*
      it('store logs eid for B',function(done){
        //var eids = _log_eid.join(';');
        logs = eidLogs.Logs();
        //console.log("list to get ", logs);
      //  console.log("list to get ", logs[0]);
        var eids =[]; 

        for (var i = 0; i < logs.length; i++) { // suite
            var value;
            for(var key in logs[i]) { // only loop once on suite key 
              value = logs[i][key]; // get values 
            }
    //    console.log("Log ", logs[i]);
    //    console.log("values ", value);

            eids = eids.concat(value.B);
        }
    //    console.log("eids  ", eids);
        eids = eids.join(";");
    //    console.log("eids  ", eids);
        supertest("https://kibdev.kobj.net/sky/cloud/"+picoLogs).get("/getLogs")
          .query({ _eci: pico_B[0][0],_eid: eid('b')})//,eids:eids})
          .expect(200)
          .end(function(err,res){
            response = res.text;
            response = JSON.parse(response);
            //var response_eids = _.map(response, function(log){ return log.; });

          //  response = _.filter(response, function(log){ 
     //         console.log("logs",response);
             // console.log("contains check.",_.contains(_log_eid,log.eid));
              //return _.contains(_log_eid,log.eid);});
     //       console.log("logs of failed operations",response);
            for (var i = 0; i < response.length; i++) {
              for (var k = 0; k < response[i].log_items.length; k++) {
                response[i].log_items[k] = _.rest(response[i].log_items[k].split(/\s+/),5); // cut off extra first 6 columns 
                response[i].log_items[k] = response[i].log_items[k].join(' '); // join last columns back together 
    //            console.log("eid ",response[i].eid);
              }
            }
            //console.log("logs of failed operations",response);
            if ( response.length > 0){
              console.log("failed logs on Pico_B operations",response);
            }
            done();
          });
        });
*/

      });
      describe('Clean up',function(done){
        it( 'remove child pico A used for testing',function(done) {
          EventApi(_eci).get('/child_deletion')
          .set('Accept', 'application/json')
          .query({deletionTarget : pico_A[0][0]})
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err,res){
            done();
          });
        });
        it( 'remove child pico B used for testing',function(done) {
          EventApi(_eci).get('/child_deletion')
          .set('Accept', 'application/json')
          .query({deletionTarget : pico_B[0][0]})
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err,res){
            done();
          });
        });
      });
    });

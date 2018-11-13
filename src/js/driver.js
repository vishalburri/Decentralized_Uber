App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Uber.json", function(uber) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Uber = TruffleContract(uber);
      // Connect provider to interact with contract
      App.contracts.Uber.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    });
  },
  listenForEvents: function() {
    App.contracts.Uber.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.RequestSent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a request is sent
        App.render();
      });

      instance.RequestCancel({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a request is cancelled by user
        App.render();
      });

    });
  },
  render: async function() {
    var loader = $("#loader");  
        
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddr").html("Your Account: " + account);
      }
    });
    var uberInstance = await App.contracts.Uber.deployed();
    if(App.account!=null) {
      var isValid = await uberInstance.isDriverValid({from:App.account});
      var reqDetails = $("#requestdetails");
      if(isValid){
        loader.hide();
        //process here request list and show
        try{
           var res = await uberInstance.getRequest({from:App.account});
          reqDetails.empty();
          reqDetails.append("<center><h1>Ride Request</h1></center>");
          reqDetails.append("<center><h4>User Address: "+res+"</h4></center>");
          reqDetails.append("<center><h4>Pickup-Latitude : 2</h4></center>");
          reqDetails.append("<center><h4>Pickup-Longitude : 2</h4></center>");
          reqDetails.append("<center><h4>Drop-Latitude : 4</h4></center>");
          reqDetails.append("<center><h4>Drop-Longitude : 4</h4></center>");
          reqDetails.append("<center><button type='button' class='btn btn-success' onclick='App.acceptRide();'>Accept</button></center>");
          reqDetails.append("<center><button type='button' class='btn btn-danger' onclick='App.rejectRide();'>Reject</button></center>");
          reqDetails.show();
        }
        catch(err){
          console.log(err.message);
          reqDetails.empty();  
          var isaccept = await uberInstance.isAccepted({from:App.account});
          if(isaccept){
          reqDetails.empty();  
          reqDetails.append("<center><h1>Current Ride</h1></center>");
          //form
          reqDetails.append("<center><button type='button' class='btn btn-success' onclick='App.startTrip();'>Start Trip</button></center>");
          reqDetails.show();
          }
          else{
          reqDetails.empty();  
          reqDetails.append("<h1>No Ride Requests</h1>");
          reqDetails.show();
          }
        }
      }
      else{
        loader.show();
      }
    }
    else{
      alert('Connect to Metamask');
    }
    // Load account data
  },
  acceptRide: async function(){
    var uberInstance = await App.contracts.Uber.deployed();
    try{
    await uberInstance.acceptRequest({from:App.account});
    App.render();
    }
    catch(err){
      console.log(err);
      App.render();
    }
  },

  rejectRide: async function(){
    var uberInstance = await App.contracts.Uber.deployed();
    try{
    await uberInstance.rejectRequest({from:App.account});
    App.render();
    }
    catch(err){
      console.log(err);
      App.render();
    }
  },
  startTrip: async function(){
    var reqDetails = $("#requestdetails");
    var uberInstance = await App.contracts.Uber.deployed();
    try{
    // await uberInstance.startTrip({from:App.account});
    reqDetails.empty();
    reqDetails.append("<center><h1>Current Ride</h1></center><br>");
    reqDetails.append("<label>Distance(km)</label>");
    reqDetails.append("<input type='text' id='kms' name='muverName'>");
    reqDetails.append("<center><button type='button' class='btn btn-success' onclick='App.endTrip();'>End Trip</button></center>");      
    reqDetails.show();
    }
    catch(err){
      App.render();
    }
  },
  endTrip: async function(){
    var reqDetails = $("#requestdetails");
    var uberInstance = await App.contracts.Uber.deployed();
    try{
    var fare = await uberInstance.getDriverFare({from:App.account});
    var cost = document.getElementById('kms').value*(fare.toNumber());  
    console.log(cost);
    await uberInstance.endTrip(cost,{from:App.account});
    reqDetails.empty();
    reqDetails.append("<center><h1>Ride Finished.Collect amount</h1></center>");
    reqDetails.show();
    }
    catch(err){
      App.render();
    }
  },

  
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
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

      // App.listenForEvents();

      return App.render();
    });
  },
  render: async function() {
    var loader = $("#loader");  
    var content = $("#updateride");
        
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddr").html("Your Account: " + account);
      }
    });
    var uberInstance = await App.contracts.Uber.deployed();
    if(App.account!=null){
      var isValid = await uberInstance.isDriverValid({from:App.account});
      if(isValid){
        loader.hide();
        content.show();
      }
      else{
        loader.show();
        content.hide();
      }
    }
    else{
      alert('Connect to Metamask');
    }
    // Load account data
  },

  updateDriver : async function(){
    var content = $("#updateride");
    var loader = $("#loader");  
    var curlat = $("#driverlat").val();
    var curlon = $("#driverlon").val();
    var fareperkm = $("#fare").val();

    // content.hide();
    var uberInstance = await App.contracts.Uber.deployed();
    try{
    await uberInstance.updateDriverDetails(fareperkm,curlat,curlon,{from:App.account});
    alert("Updated successfully");  
    }
    catch(err){
    alert("Invalid Values");  
    }
  },

  quitDriver : async function(){
    // content.hide();
    var uberInstance = await App.contracts.Uber.deployed();
    try{
    await uberInstance.quitDriving({from:App.account});
    alert("Ride request stopped");  
    }
    catch(err){
    alert("Cannot quit now");  
    }
  },

  
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
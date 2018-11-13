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
        instance.CabBooked({}, {
          fromBlock: 0,
          toBlock: 'latest'
        }).watch(function(error, event) {
          console.log("event triggered", event)
          App.render();
          // Reload when a cab is booked
        });

        instance.TripEnded({}, {
          fromBlock: 0,
          toBlock: 'latest'
        }).watch(function(error, event) {
          console.log("event triggered", event)
          App.render();  
          // Reload when a trip ends
        });

        instance.Collected({}, {
          fromBlock: 0,
          toBlock: 'latest'
        }).watch(function(error, event) {
          console.log("event triggered", event)
          App.render();
        });
    });
  },
  render: async function() {
    var loader = $("#loader");  
    var content = $("#searchride");
    var ridedetails = $("#ridedetails");
    
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    var uberInstance = await App.contracts.Uber.deployed();
    console.log(App.account);
    if(App.account!=null){
      var isValid = await uberInstance.isDriverValid({from:App.account});
      var isBooked = await uberInstance.cabBooked({from:App.account});
      var ispaid = await uberInstance.isPaid({from:App.account});
      console.log(ispaid);
      ridedetails.empty();
      if(ispaid==false){
        loader.hide();
        var payDetails = await uberInstance.getCustomerDetails({from:App.account});
        var fare = await uberInstance.getDriverFare({from:payDetails[0]});
        ridedetails.empty();
        ridedetails.append("<h3 class='text-center'>PAYMENT DETAILS</h3><hr/>");
        ridedetails.append("<center><div class='well well-sm'><h4>To : "+payDetails[0]+"</h4></div></center>");
        ridedetails.append("<center><div class='well well-sm'><h4>Distance Travelled : "+(payDetails[1]/fare.toNumber())+" km</h4></div></center>");
        ridedetails.append("<center><div class='well well-sm'><h4>Amount : "+payDetails[1]+" wei</h4></div></center>");
        ridedetails.append("<center><button type='button' class='btn btn-success' onclick='App.payDriver();'>Pay</button></center>");      
        ridedetails.show();
      }
      else if(isBooked.toNumber()!=0){
        loader.hide();
        var driverDetails = await uberInstance.getDriverDetails(isBooked.toNumber(),{from:App.account});
        ridedetails.empty();
        ridedetails.append("<h3 class='text-center'>CAB BOOKED</h3><hr/>");
        ridedetails.append("<center><div class='well well-sm'><h4>Driver Name : "+driverDetails[0]+"</h4></div></center>");
        ridedetails.append("<center><div class='well well-sm'><h4>Contact No : "+driverDetails[2]+"</h4></div></center>");
        ridedetails.append("<center><div class='well well-sm'><h4>Fareperkm : "+driverDetails[1]+" wei</h4></div></center>");
        ridedetails.append("<center><div class='well well-sm'><h4>Estimated Arrival : 30 min</h4></div></center>");
        ridedetails.show();
        // ridedetails.empty();
      }  
      else if(!isValid){
          loader.hide();
          content.show();
      } 
      else{
          alert('Login from user account');
        }
    }
    else{
      alert('Connect to Metamask');
    }
    // Load account data
  },

  estimateFare : async function(){
    var ridedetails = $("#ridedetails");
    var content = $("#searchride");
    var loader = $("#loader");  
    var curlat = $("#fromlat").val();
    var curlon = $("#fromlon").val();
    var tolat = $("#tolat").val();
    var tolon = $("#tolon").val();
    
    var uberInstance = await App.contracts.Uber.deployed();
    var fare = await uberInstance.getEstimatedFare(curlat,curlon,{from:App.account});
    var estimatedcost = (Math.pow(tolat-curlat,2)+Math.pow(tolon-curlon,2))*fare.toNumber();
    loader.empty();
    if(fare.toNumber()==0)
      loader.append("<center><h2>Could not find estimate.No cabs available right now</h2></center>");
    else
      loader.append("<center><h2>Your estimated cost : "+estimatedcost+" wei</h2></center>");
    loader.show();
  },

 

  searchDriver : async function(){
    var ridedetails = $("#ridedetails")
    var content = $("#searchride");
    var loader = $("#loader");  
    var curlat = $("#fromlat").val();
    var curlon = $("#fromlon").val();
    var tolat = $("#tolat").val();
    var tolon = $("#tolon").val();

    var uberInstance = await App.contracts.Uber.deployed();
    loader.hide();
    loader.empty();
    loader.append("<center><h2>Searching For Nearby Cabs...</h2></center>");
    loader.append("<center><div class='loading'></div></center>");

    content.hide();
    loader.show();
    const delay = ms => new Promise(res => setTimeout(res, ms));
    await delay(3000);
    var id = await uberInstance.searchDrivers(curlat,curlon,{from:App.account});
    if(id[0]==0){
      loader.empty();
      loader.append("<center><h2>Sorry No Cabs available now.Please try gain later</h2></center>");
    }
    else{
      loader.empty();
      loader.hide();

      for(var i=0;i<id.length;i++){
        if(id[i]==0)
          break;
        var details = await uberInstance.getDriverDetails(id[i],{from:App.account});
        ridedetails.append("<center><div class='well well-sm'><h4>List Of Available Drivers</h4></div></center>");
        ridedetails.append("<div class='col-sm-2'><h4>Driver-Id</h4></div><div class='col-sm-2'><h4>Name</h4></div>");
        ridedetails.append("<div class='col-sm-2'><h4>FareperKm</h4></div><div class='col-sm-2'><h4>Phone-no</h4></div>");
        ridedetails.append("<div class='col-sm-2'><h4>Send Request</h4></div><div class='col-sm-2'><h4>Cancel Request</h4></div><br>");
        ridedetails.append("<div class='col-sm-2'>"+id[i]+"</div><div class='col-sm-2'>"+details[0]+"</div>");
        ridedetails.append("<div class='col-sm-2'>"+details[1]+"</div><div class='col-sm-2'>"+details[2]+"</div>");
        ridedetails.append("<div class='col-sm-2'><button type='button' class='btn btn-success' onclick='App.sendRequest("+id[i]+");'>Send Request</button></div>");
        ridedetails.append("<div class='col-sm-2'><button type='button' class='btn btn-danger' onclick='App.cancelRequest("+id[i]+");'>Cancel Request</button></div>");
        
      }
    }
    ridedetails.show();
  },

  sendRequest : async function(id){
    var uberInstance = await App.contracts.Uber.deployed();
    try{
    console.log(id);  
    await uberInstance.sendRequest(id,{from:App.account});
    }
    catch(err){
      alert("Cannot Send Request")
      console.log(err);
    }
  },
  cancelRequest : async function(id){
    var uberInstance = await App.contracts.Uber.deployed();
    try{
    await uberInstance.cancelRequest(id,{from:App.account});
    }
    catch(err){
      alert("Cannot Cancel Request")
      console.log(err);
    }
  },

  payDriver : async function(){
    var uberInstance = await App.contracts.Uber.deployed();
    var payDetails = await uberInstance.getCustomerDetails({from:App.account});
    try{
      web3.eth.sendTransaction({to:payDetails[0],from:App.account,value:payDetails[1].toNumber()}, function(err, transactionHash){
      if (!err){
        uberInstance.paidDriver({from:App.account});
        console.log(transactionHash);
        }
      });
    }
    catch(err){
      console.log(err);
    }

  },
};

$(function() {
  $(window).load(function() {
      App.init();
  });
});
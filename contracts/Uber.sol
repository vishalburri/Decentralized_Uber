pragma solidity ^0.4.24;

contract Uber {

  address public owner;
  
  struct Driver {
    string name;
    address customerAddr;
    string license;
    uint farePerKm;
    int latitude;
    int longitude;
    uint phoneNo;
    int status;
    bool valid;
  }

  struct Customer {
    address driverAddr;
    uint amountToPay;
    bool isBusy;
  }
  
  mapping(uint => Driver)  driverList;
  mapping (address => uint) mapDriver;
  mapping(uint => address) reqList;
  mapping (address => Customer) customer;

  event Collected(address sender,uint amount);
  event CabBooked(address sender);
  event RequestSent(address sender);
  event TripEnded(address sender);


  uint public numDrivers;
  uint public regFee;

  //status = 0,1,2,3  new,ready,onrequest,accepted

  modifier restricted() {
    if (msg.sender == owner) _;
  }

  constructor(uint _regFee) public {
    owner = msg.sender;
    regFee = _regFee;
  }

  function registerDriver(string _name,string _license,uint _phoneno) public payable {
      require (!driverList[mapDriver[msg.sender]].valid,"Not a valid address");
      require (msg.value >= regFee,"Insufficient Registration Fee");
            
      numDrivers = numDrivers + 1;
      mapDriver[msg.sender] = numDrivers;
      driverList[numDrivers] = Driver({
        name : _name,
        customerAddr : address(0),
        license : _license,
        farePerKm : 0,
        latitude : 0,
        longitude : 0,
        phoneNo : _phoneno,
        status : 0,
        valid  : true
      });
  }
 
  function getDriverDetails (uint id) public view returns(string,uint,uint)  {
    require (id >0 && id <=numDrivers,"Invalid id of driver");

    return (driverList[id].name,driverList[id].farePerKm,driverList[id].phoneNo);
  }

  function getCustomerDetails() public view returns(address,uint)  {
    require (!driverList[mapDriver[msg.sender]].valid,"Cannot use from driver address");
    
    return (customer[msg.sender].driverAddr,customer[msg.sender].amountToPay);
  }
  
 
  
  function max(uint a, uint b) private pure returns (uint) {
        return a > b ? a : b;
  }

  function getEstimatedFare (int _latitude,int _longitude) public view returns(uint res)  {
    require (!driverList[mapDriver[msg.sender]].valid,"Cannot use from driver address");
    require (customer[msg.sender].isBusy==false,"Cannot request ride now");
    
    uint fare;
    for(uint i=1;i<=numDrivers;i++){
        int disLat = (_latitude - driverList[i].latitude) * (_latitude - driverList[i].latitude);
        int disLon = (_longitude - driverList[i].longitude) * (_longitude - driverList[i].longitude);
        if(disLat + disLon < 100 && driverList[i].status==1)
          {
            fare = max(fare,driverList[i].farePerKm);
          }
      }
    return fare;  
  }
  

  function searchDrivers(int _latitude,int _longitude) public view returns(uint[]){
      require (!driverList[mapDriver[msg.sender]].valid,"Cannot use from driver address");
      require (customer[msg.sender].isBusy==false,"Cannot request ride now");
      //returns driver id
      uint[] memory requestList = new uint[](5);
      uint count = 0;
      for(uint i=1;i<=numDrivers;i++){
        int disLat = (_latitude - driverList[i].latitude) * (_latitude - driverList[i].latitude);
        int disLon = (_longitude - driverList[i].longitude) * (_longitude - driverList[i].longitude);
        if(disLat + disLon < 100 && driverList[i].status==1)
          {
            requestList[count] = i;
            count++;
            if(count==5)
              break;
          }
      } 
      return requestList;
  }

  //Called by user
  function sendRequest (uint id) public {
    require (!driverList[mapDriver[msg.sender]].valid,"Not a valid address");
    require (driverList[id].status==1,"Driver is busy");
    require (customer[msg.sender].isBusy==false,"Cannot request now");

    customer[msg.sender].isBusy = true; 
    reqList[id] = msg.sender;
    driverList[id].status = 2;       
    emit RequestSent(msg.sender);        
  }

  //Called by user
  function cancelRequest(uint id) public {
    require (!driverList[mapDriver[msg.sender]].valid,"Not a valid address");
    require (driverList[id].status==2,"Cannot cancel now");
    require (customer[msg.sender].isBusy==true,"Cannot remove request now");

    driverList[id].status = 1;
    customer[msg.sender].isBusy = false;
    reqList[id] = address(0);
  }
  
  //Called by driver
  function getRequest() public view returns(address)  {
    require (driverList[mapDriver[msg.sender]].valid,"Not a valid address");
    require (driverList[mapDriver[msg.sender]].customerAddr==address(0),"Cannot request while driving");
    require (driverList[mapDriver[msg.sender]].status==2,"Cannot getRequest now");
    
    return reqList[mapDriver[msg.sender]];  
  }
  
  //Called by driver
  function acceptRequest() public {
    require (driverList[mapDriver[msg.sender]].valid,"Not a valid address");
    require (driverList[mapDriver[msg.sender]].customerAddr==address(0),"Cannot request while driving");
    require (driverList[mapDriver[msg.sender]].status==2,"Cannot accept now");

    driverList[mapDriver[msg.sender]].customerAddr = reqList[mapDriver[msg.sender]];
    driverList[mapDriver[msg.sender]].status = 3;
    customer[reqList[mapDriver[msg.sender]]].driverAddr = msg.sender;
    emit CabBooked(msg.sender);
  }

  //Called by driver
  function rejectRequest() public {
    require (driverList[mapDriver[msg.sender]].valid,"Not a valid address");
    require (driverList[mapDriver[msg.sender]].customerAddr==address(0),"Cannot request while driving");
    require (driverList[mapDriver[msg.sender]].status==2,"Cannot reject now");

    driverList[mapDriver[msg.sender]].status = 1;
    customer[reqList[mapDriver[msg.sender]]].isBusy = false;
    reqList[mapDriver[msg.sender]] = address(0);
  }

  //called by driver
  function isAccepted() public view returns(bool res)  {
    require (driverList[mapDriver[msg.sender]].valid,"Not a valid address");
    if(driverList[mapDriver[msg.sender]].status==3)
      return true;
    else
      return false;  
  }
  
  function cabBooked() public view returns(uint res){
    require (!driverList[mapDriver[msg.sender]].valid,"Not a valid address");
    if(customer[msg.sender].driverAddr!=address(0))
      return mapDriver[customer[msg.sender].driverAddr];
    else
      return 0;      
  }
  

  function updateDriverDetails(uint _fareperkm,int _latitude,int _longitude) public {
    require (driverList[mapDriver[msg.sender]].valid,"Not a valid address");

    driverList[mapDriver[msg.sender]].latitude = _latitude;
    driverList[mapDriver[msg.sender]].longitude = _longitude;
    driverList[mapDriver[msg.sender]].farePerKm = _fareperkm;
    driverList[mapDriver[msg.sender]].status = 1;
  }

  function quitDriving() public {
    require (driverList[mapDriver[msg.sender]].valid,"Not a valid address");
    require (driverList[mapDriver[msg.sender]].status==1,"Driver is busy");

    driverList[mapDriver[msg.sender]].status = 0;
  }

  function isDriverValid() public view returns(bool res) {
    if(mapDriver[msg.sender]>0)
      return true;
    else
      return false;  
  }
  
   
  function endTrip(uint cost) public {
    require (driverList[mapDriver[msg.sender]].valid,"Not a valid address");
    require (driverList[mapDriver[msg.sender]].customerAddr!=address(0),"Cannot end now");
    
    customer[driverList[mapDriver[msg.sender]].customerAddr].amountToPay = cost;
    reqList[mapDriver[msg.sender]] = address(0);
    driverList[mapDriver[msg.sender]].status = 1;
    driverList[mapDriver[msg.sender]].customerAddr = address(0);
    emit TripEnded(msg.sender);
  }

  function paidDriver() public {
    require (!driverList[mapDriver[msg.sender]].valid,"Not a valid address");
    require (customer[msg.sender].driverAddr!=address(0),"Cannot pay");

    emit Collected(customer[msg.sender].driverAddr,customer[msg.sender].amountToPay);
    customer[msg.sender].amountToPay = 0;
    customer[msg.sender].driverAddr = address(0);
    customer[msg.sender].isBusy = false; 
  }

  function isPaid() public view returns(bool res) {
    require (!driverList[mapDriver[msg.sender]].valid,"Not a valid address");
    if(customer[msg.sender].amountToPay == 0)
      return true;
     else
     return false; 
  }
  
  


}

var Uber = artifacts.require("Uber");

// Helps in asserting events
const truffleAssert = require("truffle-assertions");

contract("Uber", accounts => {
	const owner = accounts[0];
	describe("constructor", () => {
		describe("Assert Contract is deployed", () => {
			it("should deploy this contract", async () => {
				const instance = await Uber.new(10,{ from: owner });

				let fee = await instance.regFee.call();

				assert.isNotNull(instance);
				assert.equal(fee.toNumber(), 10);
				
			});
		});
		describe("Fail case", () => {
			it("should revert on invalid from address", async () => {
				try {
					const instance = await Uber.new(10 ,{
						from: "lol"
					});
					assert.fail(
						"should have thrown an error in the above line"
					);
				} catch (err) {
					assert.equal(err.message, "invalid address");
				}
			});
		});
	});
	describe("Driver Register", () => {
		let instance;

		beforeEach(async () => {
			instance = await Uber.new(10, { from: owner });
		});

		describe("Success Case", () => {
			it("A person can successfully register", async () => {
				let result = await instance.registerDriver("vishal","TS00592xc",7013288391,{
					from: accounts[1],value : web3.toWei(10, "wei")
				});
				// truffleAssert.eventEmitted(result, "event name");
				assert.equal(
					await instance.numDrivers.call(),
					1,
					"num of players registered drivers should be 1"
				);
			});
		});
		describe("Success Case", () => {
			it("3 persons can successfully register", async () => {
				await instance.registerDriver("vishal","TS00592xc",7013288391,{
					from: accounts[1],value : web3.toWei(10, "wei")
				});
				await instance.registerDriver("vikas","TS00123xc",9515678452,{
					from: accounts[2],value : web3.toWei(10, "wei")
				});
				await instance.registerDriver("deeraj","TS00592xc",7024145245,{
					from: accounts[3],value : web3.toWei(10, "wei")
				});
				// truffleAssert.eventEmitted(result, "event name");
				assert.equal(
					await instance.numDrivers.call(),
					3,
					"num of players registered drivers should be 1"
				);
			});
		});
		describe("Fail Case", () => {
			it("cannot register twice from same address", async () => {
				await instance.registerDriver("vishal","TS00592xc",7013288391,{
					from: accounts[1],value : web3.toWei(10, "wei")
				});
				try {
						await instance.registerDriver("vishal","TS00592xc",7013288391,{
							from: accounts[1],value : web3.toWei(10, "wei")
						});

					} catch (err) {
					assert.equal(
						err.message,
						"VM Exception while processing transaction: revert Not a valid address"
					);		
				}
				assert.equal(
					await instance.numDrivers.call(),
					1,
					"There should be only 1 driver"
				);
				
			});
		});
		describe("Fail Case", () => {
			it("Insufficient reg Fee", async () => {
				try {
						await instance.registerDriver("vishal","TS00592xc",7013288391,{
							from: accounts[1],value : web3.toWei(5, "wei")
						});

					} catch (err) {
					assert.equal(
						err.message,
						"VM Exception while processing transaction: revert Insufficient Registration Fee"
					);		
				}
				
			});
		});
	});
	describe("Driver Updating Details(Ready state)", () => {
		let instance;

		beforeEach(async () => {
			instance = await Uber.new(10, { from: owner });
			await instance.registerDriver("vishal","TS00592xc",7013288391,{
					from: accounts[1],value : web3.toWei(10, "wei")
				});
			await instance.registerDriver("vikas","TS00123xc",9515678452,{
				from: accounts[2],value : web3.toWei(10, "wei")
			});
			await instance.registerDriver("deeraj","TS00592xc",7024145245,{
				from: accounts[3],value : web3.toWei(10, "wei")
			});
		});

		describe("Success Case", () => {
			it("Drivers Updated their fareperkm,location", async () => {
				await instance.updateDriverDetails(5,1,1,{
					from: accounts[1]
				});
				await instance.updateDriverDetails(10,2,2,{
					from: accounts[2]
				});
				await instance.updateDriverDetails(15,100,100,{
					from: accounts[3]
				});
			});
		});
		describe("Fail Case", () => {
			it("Unregistered Driver cannot update", async () => {
				try {
						await instance.updateDriverDetails(5,1,1,{
							from: accounts[4]
						});

					} catch (err) {
					assert.equal(
						err.message,
						"VM Exception while processing transaction: revert Not a valid address"
					);		
				}
				
			});
		});
	});
	describe("User Estimating Fare", () => {
		let instance;

		beforeEach(async () => {
			instance = await Uber.new(10, { from: owner });
			await instance.registerDriver("vishal","TS00592xc",7013288391,{
					from: accounts[1],value : web3.toWei(10, "wei")
				});
			await instance.registerDriver("vikas","TS00123xc",9515678452,{
				from: accounts[2],value : web3.toWei(10, "wei")
			});
			await instance.registerDriver("deeraj","TS00591xc",7024145245,{
				from: accounts[3],value : web3.toWei(10, "wei")
			});
			await instance.registerDriver("avinash","TS00594xc",9013288391,{
				from: accounts[4],value : web3.toWei(10, "wei")
			});
			await instance.updateDriverDetails(5,1,1,{
					from: accounts[1]
				});
			await instance.updateDriverDetails(10,2,2,{
				from: accounts[2]
			});
			await instance.updateDriverDetails(15,100,100,{
				from: accounts[3]
			});
		});

		describe("Success Case", () => {
			it("Fare estimated Success", async () => {
				let result = await instance.getEstimatedFare(2,2,{
					from: accounts[5]
				});
				assert.equal(
					result.toNumber(),
					10,
					"10 should be estimated fareperkm"
				);
			});
		});
		describe("Success Case", () => {
			it("No cabs available(No fare estimate)", async () => {
				let result = await instance.getEstimatedFare(200,200,{
					from: accounts[5]
				});
				assert.equal(
					result.toNumber(),
					0,
					"0 should be estimated fareperkm"
				);
			});
		});
		describe("Fail Case", () => {
			it("Cannot Estimate from driver address", async () => {
				try {
						let result = await instance.getEstimatedFare(200,200,{
							from: accounts[3]
						});
					} catch (err) {
					assert.equal(
						err.message,
						"VM Exception while processing transaction: revert Cannot use from driver address"
					);		
				}
				
			});
		});
	});
	describe("User Searching Drivers", () => {
		let instance;

		beforeEach(async () => {
			instance = await Uber.new(10, { from: owner });
			await instance.registerDriver("vishal","TS00592xc",7013288391,{
					from: accounts[1],value : web3.toWei(10, "wei")
				});
			await instance.registerDriver("vikas","TS00123xc",9515678452,{
				from: accounts[2],value : web3.toWei(10, "wei")
			});
			await instance.registerDriver("deeraj","TS00591xc",7024145245,{
				from: accounts[3],value : web3.toWei(10, "wei")
			});
			await instance.registerDriver("avinash","TS00594xc",9013288391,{
				from: accounts[4],value : web3.toWei(10, "wei")
			});
			await instance.updateDriverDetails(5,1,1,{
					from: accounts[1]
				});
			await instance.updateDriverDetails(10,2,2,{
				from: accounts[2]
			});
			await instance.updateDriverDetails(15,100,100,{
				from: accounts[3]
			});
		});

		describe("Success Case", () => {
			it("Searched 2 nearby drivers", async () => {
				let result = await instance.searchDrivers(2,2,{
					from: accounts[5]
				});
				assert.equal(
					result[0].toNumber(),
					1,
					"1 should be id of driver"
				);
				assert.equal(
					result[1].toNumber(),
					2,
					"2 should be id of driver"
				);
			});
		});
		describe("Fail Case", () => {
			it("Cannot Search from driver address", async () => {
				try {
						let result = await instance.searchDrivers(2,2,{
							from: accounts[3]
						});
					} catch (err) {
					assert.equal(
						err.message,
						"VM Exception while processing transaction: revert Cannot use from driver address"
					);		
				}
				
			});
		});
		describe("Success Case", () => {
			it("No drivers found", async () => {
				let result = await instance.searchDrivers(300,300,{
					from: accounts[5]
				});
				assert.equal(
					result[0].toNumber(),
					0,
					"0 drivers found"
				);
			});
		});
	});
	describe("Request Handler", () => {
		let instance,result;

		beforeEach(async () => {
			instance = await Uber.new(10, { from: owner });
			await instance.registerDriver("vishal","TS00592xc",7013288391,{
					from: accounts[1],value : web3.toWei(10, "wei")
				});
			await instance.registerDriver("vikas","TS00123xc",9515678452,{
				from: accounts[2],value : web3.toWei(10, "wei")
			});
			await instance.registerDriver("deeraj","TS00591xc",7024145245,{
				from: accounts[3],value : web3.toWei(10, "wei")
			});
			await instance.registerDriver("avinash","TS00594xc",9013288391,{
				from: accounts[4],value : web3.toWei(10, "wei")
			});
			await instance.updateDriverDetails(5,1,1,{
					from: accounts[1]
				});
			await instance.updateDriverDetails(10,2,2,{
				from: accounts[2]
			});
			await instance.updateDriverDetails(15,100,100,{
				from: accounts[3]
			});
			result = await instance.searchDrivers(2,2,{
					from: accounts[5]
				});
		});

		describe("Success Case", () => {
			it("Sent Request to driver", async () => {
				await instance.sendRequest(result[0].toNumber(),{
					from: accounts[5]
				});
			});
		});
		describe("Fail Case", () => {
			it("Cannot sendRequest from driver address", async () => {
				try {
						await instance.sendRequest(result[0].toNumber(),{
							from: accounts[3]
						});
					} catch (err) {
					assert.equal(
						err.message,
						"VM Exception while processing transaction: revert Not a valid address"
					);		
				}
			});
		});
		describe("Fail Case", () => {
			it("Cannot sendRequest multiple Requests", async () => {
				try {
						await instance.sendRequest(result[0].toNumber(),{
							from: accounts[5]
						});
						await instance.sendRequest(result[1].toNumber(),{
							from: accounts[5]
						});
					} catch (err) {
					assert.equal(
						err.message,
						"VM Exception while processing transaction: revert Cannot request now"
					);		
				}
			});
		});
		describe("Success Case", () => {
			it("Cancelled Request ", async () => {
				await instance.sendRequest(result[0].toNumber(),{
							from: accounts[5]
						});
				await instance.cancelRequest(result[0].toNumber(),{
					from: accounts[5]
				});
			});
		});
		describe("Fail Case", () => {
			it("Cannot cancelRequest without sending", async () => {
				try {
						await instance.cancelRequest(result[1].toNumber(),{
							from: accounts[5]
						});
					} catch (err) {
					assert.equal(
						err.message,
						"VM Exception while processing transaction: revert Cannot cancel now"
					);		
				}
			});
		});
	});
	describe("Response Handler", () => {
		let instance,result;

		beforeEach(async () => {
			instance = await Uber.new(10, { from: owner });
			await instance.registerDriver("vishal","TS00592xc",7013288391,{
					from: accounts[1],value : web3.toWei(10, "wei")
				});
			await instance.registerDriver("vikas","TS00123xc",9515678452,{
				from: accounts[2],value : web3.toWei(10, "wei")
			});
			await instance.registerDriver("deeraj","TS00591xc",7024145245,{
				from: accounts[3],value : web3.toWei(10, "wei")
			});
			await instance.registerDriver("avinash","TS00594xc",9013288391,{
				from: accounts[4],value : web3.toWei(10, "wei")
			});
			await instance.updateDriverDetails(5,1,1,{
					from: accounts[1]
				});
			await instance.updateDriverDetails(10,2,2,{
				from: accounts[2]
			});
			await instance.updateDriverDetails(15,100,100,{
				from: accounts[3]
			});
			result = await instance.searchDrivers(2,2,{
					from: accounts[5]
				});
			await instance.sendRequest(result[0].toNumber(),{
				from: accounts[5]
			});
		});

		describe("Success Case", () => {
			it("Request Accepted by driver", async () => {
				await instance.acceptRequest({
					from: accounts[1]
				});
			});
		});
		describe("Fail Case", () => {
			it("Cannot Accept request from user address", async () => {
				try {
						await instance.acceptRequest({
							from: accounts[5]
						});
					} catch (err) {
					assert.equal(
						err.message,
						"VM Exception while processing transaction: revert Not a valid address"
					);		
				}
			});
		});
		describe("Fail Case", () => {
			it("Cannot Accept request from other driver address", async () => {
				try {
						await instance.acceptRequest({
							from: accounts[2]
						});
					} catch (err) {
					assert.equal(
						err.message,
						"VM Exception while processing transaction: revert Cannot accept now"
					);		
				}
			});
		});
	});
	describe("Trip Start and End", () => {
		let instance,result;

		beforeEach(async () => {
			instance = await Uber.new(10, { from: owner });
			await instance.registerDriver("vishal","TS00592xc",7013288391,{
					from: accounts[1],value : web3.toWei(10, "wei")
				});
			await instance.registerDriver("vikas","TS00123xc",9515678452,{
				from: accounts[2],value : web3.toWei(10, "wei")
			});
			await instance.registerDriver("deeraj","TS00591xc",7024145245,{
				from: accounts[3],value : web3.toWei(10, "wei")
			});
			await instance.registerDriver("avinash","TS00594xc",9013288391,{
				from: accounts[4],value : web3.toWei(10, "wei")
			});
			await instance.updateDriverDetails(5,1,1,{
					from: accounts[1]
				});
			await instance.updateDriverDetails(10,2,2,{
				from: accounts[2]
			});
			await instance.updateDriverDetails(15,100,100,{
				from: accounts[3]
			});
			result = await instance.searchDrivers(2,2,{
					from: accounts[5]
				});
			await instance.sendRequest(result[0].toNumber(),{
				from: accounts[5]
			});
			await instance.acceptRequest({
					from: accounts[1]
			});
		});
		describe("Success Case", () => {
			it("Cab Booked", async () => {
				let booked = await instance.cabBooked({
					from : accounts[5]
				});
				assert.equal(
					booked.toNumber(),
					1,
					"driver id 1 booked"
				);
			});
		});
		describe("Success Case", () => {
			it("Start Trip", async () => {
				return;
			});
		});
		describe("Success Case", () => {
			it("End Trip", async () => {
				await instance.endTrip(40,{
					from : accounts[1]
				});
			});
		});
	});
	describe("Process Trip Payment", () => {
		let instance,result;

		beforeEach(async () => {
			instance = await Uber.new(10, { from: owner });
			await instance.registerDriver("vishal","TS00592xc",7013288391,{
					from: accounts[1],value : web3.toWei(10, "wei")
				});
			await instance.registerDriver("vikas","TS00123xc",9515678452,{
				from: accounts[2],value : web3.toWei(10, "wei")
			});
			await instance.registerDriver("deeraj","TS00591xc",7024145245,{
				from: accounts[3],value : web3.toWei(10, "wei")
			});
			await instance.registerDriver("avinash","TS00594xc",9013288391,{
				from: accounts[4],value : web3.toWei(10, "wei")
			});
			await instance.updateDriverDetails(5,1,1,{
					from: accounts[1]
				});
			await instance.updateDriverDetails(10,2,2,{
				from: accounts[2]
			});
			await instance.updateDriverDetails(15,100,100,{
				from: accounts[3]
			});
			result = await instance.searchDrivers(2,2,{
					from: accounts[5]
				});
			await instance.sendRequest(result[0].toNumber(),{
				from: accounts[5]
			});
			await instance.acceptRequest({
					from: accounts[1]
			});
			await instance.endTrip(40,{
					from : accounts[1]
			});
		});
		describe("Success Case", () => {
			it("Paid to Driver", async () => {
				await instance.paidDriver({
					from : accounts[5]
				});
				let ispaid = await instance.isPaid({
					from : accounts[5]
				});
				assert.equal(
					ispaid,
					true,
					"payment done"
				);
			});
		});
	});
});
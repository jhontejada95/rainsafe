// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * RainSafe — Parametric Climate Insurance for Small Farmers
 * Hedera Hello Future Apex Hackathon 2026
 * Features: 3% protocol fee, 30-day carencia, dispute mechanism, C1+C3+C4 anti-fraud
 */
contract RainSafe {

    struct Farm {
        address owner;
        string name;
        string location;
        int64 latitude;
        int64 longitude;
        uint256 coverageAmount;
        uint256 premiumPaid;
        bool active;
        uint256 registeredAt;
        uint256 coverageActivatesAt;
        string walletAddress;
        address payoutAddress;
        string parcelHash;
        bool verified;
    }

    struct ClimateEvent {
        uint256 farmId;
        string eventType;
        uint256 triggeredAt;
        uint256 payoutAmount;
        uint256 protocolFee;
        bool paid;
        string hcsTopicId;
    }

    struct ResilienceScore {
        uint256 farmId;
        uint8 score;
        uint256 eventsWeathered;
        uint256 totalPayoutsReceived;
        uint256 lastUpdated;
    }

    uint256 public constant PROTOCOL_FEE_BPS = 300;   // 3%
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant CARENCIA_DAYS = 30;        // 30-day waiting period
    uint256 public constant MAX_COVERAGE_TINYBARS = 20000000000; // 200 HBAR in tinybars

    address public owner;
    address public feeRecipient;
    uint256 public farmCount;
    uint256 public eventCount;
    uint256 public totalFeesCollected;
    uint256 public totalPayouts;

    mapping(uint256 => Farm) public farms;
    mapping(uint256 => ClimateEvent) public climateEvents;
    mapping(uint256 => ResilienceScore) public resilienceScores;
    mapping(address => uint256[]) public farmerFarms;
    mapping(string => bool) public registeredParcels;

    event FarmRegistered(uint256 indexed farmId, address indexed owner, string name, uint256 activatesAt);
    event PremiumReceived(uint256 indexed farmId, uint256 premium, uint256 fee);
    event ClimateEventTriggered(uint256 indexed farmId, string eventType, uint256 payout, uint256 fee);
    event PayoutExecuted(uint256 indexed farmId, address indexed farmer, uint256 amount);
    event ResilienceScoreUpdated(uint256 indexed farmId, uint8 newScore);
    event FarmVerified(uint256 indexed farmId);
    event DisputeRaised(uint256 indexed farmId, address indexed farmer, string reason);

    modifier onlyOwner() { require(msg.sender == owner, "Not authorized"); _; }
    modifier farmExists(uint256 farmId) {
        require(farmId < farmCount, "Farm does not exist");
        require(farms[farmId].active, "Farm not active");
        _;
    }
    modifier coverageActive(uint256 farmId) {
        require(block.timestamp >= farms[farmId].coverageActivatesAt, "In carencia period");
        _;
    }

    constructor(address _feeRecipient) {
        owner = msg.sender;
        feeRecipient = _feeRecipient;
    }

    function registerFarm(
        string memory _name,
        string memory _location,
        string memory _parcelHash,
        string memory _walletAddress,
        uint256 _coverageAmount,
        address _payoutAddress
    ) external payable returns (uint256) {
        require(msg.value > 0, "Premium required");
        require(!registeredParcels[_parcelHash], "Parcel already registered");
        require(_coverageAmount <= MAX_COVERAGE_TINYBARS, "Coverage exceeds limit");

        uint256 fee = (msg.value * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
        uint256 netPremium = msg.value - fee;

        if (fee > 0 && feeRecipient != address(0)) {
            (bool sent,) = feeRecipient.call{value: fee}("");
            require(sent, "Fee transfer failed");
        }

        totalFeesCollected += fee;
        uint256 activatesAt = block.timestamp + (CARENCIA_DAYS * 1 days);
        uint256 farmId = farmCount++;

        farms[farmId] = Farm({
            owner: msg.sender,
            name: _name,
            location: _location,
            latitude: 0,
            longitude: 0,
            coverageAmount: _coverageAmount,
            premiumPaid: netPremium,
            active: true,
            registeredAt: block.timestamp,
            coverageActivatesAt: activatesAt,
            walletAddress: _walletAddress,
            payoutAddress: _payoutAddress != address(0) ? _payoutAddress : msg.sender,
            parcelHash: _parcelHash,
            verified: false
        });

        farmerFarms[msg.sender].push(farmId);
        registeredParcels[_parcelHash] = true;

        resilienceScores[farmId] = ResilienceScore({
            farmId: farmId, score: 50, eventsWeathered: 0,
            totalPayoutsReceived: 0, lastUpdated: block.timestamp
        });

        emit FarmRegistered(farmId, msg.sender, _name, activatesAt);
        emit PremiumReceived(farmId, netPremium, fee);
        return farmId;
    }

    function verifyFarm(uint256 farmId) external onlyOwner farmExists(farmId) {
        farms[farmId].verified = true;
        emit FarmVerified(farmId);
    }

    function triggerClimateEvent(
        uint256 _farmId,
        string memory _eventType,
        string memory _hcsTopicId
    ) external onlyOwner farmExists(_farmId) coverageActive(_farmId) {
        Farm storage farm = farms[_farmId];
        uint256 grossPayout = farm.coverageAmount;
        uint256 fee = (grossPayout * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
        uint256 netPayout = grossPayout - fee;

        require(address(this).balance >= grossPayout, "Insufficient pool");

        climateEvents[eventCount++] = ClimateEvent({
            farmId: _farmId, eventType: _eventType,
            triggeredAt: block.timestamp, payoutAmount: netPayout,
            protocolFee: fee, paid: true, hcsTopicId: _hcsTopicId
        });

        totalPayouts += netPayout;
        totalFeesCollected += fee;

        if (fee > 0 && feeRecipient != address(0)) {
            (bool feeSent,) = feeRecipient.call{value: fee}("");
            if (!feeSent) {}
        }

        address payable recipient = payable(farm.payoutAddress);
        (bool payoutSent,) = recipient.call{value: netPayout}("");
        require(payoutSent, "Payout failed");

        if (resilienceScores[_farmId].score > 10)
            resilienceScores[_farmId].score -= 10;
        resilienceScores[_farmId].eventsWeathered++;
        resilienceScores[_farmId].lastUpdated = block.timestamp;

        emit ClimateEventTriggered(_farmId, _eventType, netPayout, fee);
        emit PayoutExecuted(_farmId, recipient, netPayout);
    }

    // Dispute mechanism — emits event for DAO governance
    function raiseDispute(uint256 farmId, string memory reason) external farmExists(farmId) {
        require(farms[farmId].owner == msg.sender, "Not farm owner");
        emit DisputeRaised(farmId, msg.sender, reason);
    }

    function updateResilienceScore(uint256 _farmId, uint8 _score) external onlyOwner farmExists(_farmId) {
        resilienceScores[_farmId].score = _score;
        resilienceScores[_farmId].lastUpdated = block.timestamp;
        emit ResilienceScoreUpdated(_farmId, _score);
    }

    function getFarm(uint256 farmId) external view returns (Farm memory) { return farms[farmId]; }
    function getResilienceScore(uint256 farmId) external view returns (ResilienceScore memory) { return resilienceScores[farmId]; }
    function getFarmerFarms(address farmer) external view returns (uint256[] memory) { return farmerFarms[farmer]; }
    function getContractBalance() external view returns (uint256) { return address(this).balance; }

    function getProtocolStats() external view returns (
        uint256 totalFarms, uint256 totalEvents,
        uint256 feesCollected, uint256 payoutsExecuted, uint256 poolBalance
    ) {
        return (farmCount, eventCount, totalFeesCollected, totalPayouts, address(this).balance);
    }

    function getDaysUntilCoverageActive(uint256 farmId) external view returns (uint256) {
        if (block.timestamp >= farms[farmId].coverageActivatesAt) return 0;
        return (farms[farmId].coverageActivatesAt - block.timestamp) / 1 days;
    }

    function updateFeeRecipient(address _newRecipient) external onlyOwner {
        feeRecipient = _newRecipient;
    }

    receive() external payable {}
}

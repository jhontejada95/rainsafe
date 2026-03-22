// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RainSafe
 * @notice Parametric climate insurance for small farmers
 * @dev Deployed on Hedera Smart Contract Service (EVM-compatible)
 */
contract RainSafe {

    // ─── Structs ────────────────────────────────────────────────────────────

    struct Farm {
        address owner;
        string name;
        string location;      // e.g. "Bogotá, Colombia"
        int64 latitude;
        int64 longitude;
        uint256 coverageAmount; // in tinybars
        bool active;
        uint256 registeredAt;
    }

    struct ClimateEvent {
        uint256 farmId;
        string eventType;     // "drought" | "flood"
        uint256 triggeredAt;
        uint256 payoutAmount;
        bool paid;
        string hcsTopicId;    // reference to HCS record
    }

    struct ResilienceScore {
        uint256 farmId;
        uint8 score;          // 0–100
        uint256 eventsWeathered;
        uint256 totalPayoutsReceived;
        uint256 lastUpdated;
    }

    // ─── State ───────────────────────────────────────────────────────────────

    address public owner;
    uint256 public farmCount;
    uint256 public eventCount;

    // Thresholds
    uint8 public constant DROUGHT_THRESHOLD_MM = 5;   // < 5mm in 7 days
    uint16 public constant FLOOD_THRESHOLD_MM = 150;  // > 150mm in 24h

    mapping(uint256 => Farm) public farms;
    mapping(uint256 => ClimateEvent) public climateEvents;
    mapping(uint256 => ResilienceScore) public resilienceScores;
    mapping(address => uint256[]) public farmerFarms;

    // ─── Events ──────────────────────────────────────────────────────────────

    event FarmRegistered(uint256 indexed farmId, address indexed owner, string location);
    event ClimateEventTriggered(uint256 indexed farmId, string eventType, uint256 payoutAmount);
    event PayoutExecuted(uint256 indexed farmId, address indexed farmer, uint256 amount);
    event ResilienceScoreUpdated(uint256 indexed farmId, uint8 newScore);

    // ─── Modifiers ───────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier farmExists(uint256 farmId) {
        require(farmId < farmCount, "Farm does not exist");
        require(farms[farmId].active, "Farm is not active");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─── Core Functions ──────────────────────────────────────────────────────

    /**
     * @notice Register a new farm for climate insurance coverage
     */
    function registerFarm(
        string memory _name,
        string memory _location,
        uint256 _coverageAmount
    ) external payable returns (uint256) {
        require(msg.value >= _coverageAmount / 10, "Insufficient premium payment");

        uint256 farmId = farmCount++;
        farms[farmId] = Farm({
            owner: msg.sender,
            name: _name,
            location: _location,
            latitude: 0,
            longitude: 0,
            coverageAmount: _coverageAmount,
            active: true,
            registeredAt: block.timestamp
        });

        farmerFarms[msg.sender].push(farmId);

        resilienceScores[farmId] = ResilienceScore({
            farmId: farmId,
            score: 50,
            eventsWeathered: 0,
            totalPayoutsReceived: 0,
            lastUpdated: block.timestamp
        });

        emit FarmRegistered(farmId, msg.sender, _location);
        return farmId;
    }

    /**
     * @notice Trigger a climate event payout (called by authorized monitor agent)
     * @param _farmId Farm identifier
     * @param _eventType "drought" or "flood"
     * @param _hcsTopicId Reference to the HCS immutable record
     */
    function triggerClimateEvent(
        uint256 _farmId,
        string memory _eventType,
        string memory _hcsTopicId
    ) external onlyOwner farmExists(_farmId) {
        Farm storage farm = farms[_farmId];
        uint256 payout = farm.coverageAmount;

        require(address(this).balance >= payout, "Insufficient contract balance");

        uint256 eventId = eventCount++;
        climateEvents[eventId] = ClimateEvent({
            farmId: _farmId,
            eventType: _eventType,
            triggeredAt: block.timestamp,
            payoutAmount: payout,
            paid: false,
            hcsTopicId: _hcsTopicId
        });

        // Execute payout immediately
        climateEvents[eventId].paid = true;
        (bool success, ) = payable(farm.owner).call{value: payout}(""); require(success, "Payout failed");

        // Update resilience score
        _updateResilienceScore(_farmId, payout);

        emit ClimateEventTriggered(_farmId, _eventType, payout);
        emit PayoutExecuted(_farmId, farm.owner, payout);
    }

    /**
     * @notice Update the AI-computed Climate Resilience Score
     * @dev Called by the off-chain AI agent after analysis
     */
    function updateResilienceScore(
        uint256 _farmId,
        uint8 _score
    ) external onlyOwner farmExists(_farmId) {
        resilienceScores[_farmId].score = _score;
        resilienceScores[_farmId].lastUpdated = block.timestamp;
        emit ResilienceScoreUpdated(_farmId, _score);
    }

    // ─── Internal ────────────────────────────────────────────────────────────

    function _updateResilienceScore(uint256 _farmId, uint256 _payoutAmount) internal {
        ResilienceScore storage rs = resilienceScores[_farmId];
        rs.eventsWeathered += 1;
        rs.totalPayoutsReceived += _payoutAmount;
        rs.lastUpdated = block.timestamp;
        // Basic score calculation — AI agent refines this off-chain
        if (rs.score > 10) rs.score -= 5;
    }

    // ─── View Functions ──────────────────────────────────────────────────────

    function getFarm(uint256 farmId) external view returns (Farm memory) {
        return farms[farmId];
    }

    function getResilienceScore(uint256 farmId) external view returns (ResilienceScore memory) {
        return resilienceScores[farmId];
    }

    function getFarmerFarms(address farmer) external view returns (uint256[] memory) {
        return farmerFarms[farmer];
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // Allow contract to receive HBAR
    receive() external payable {}
}

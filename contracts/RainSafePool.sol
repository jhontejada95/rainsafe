// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * RainSafePool — Multi-source insurance pool
 * Sources: farmer premiums + ONG donations + ESG investor deposits
 * Hedera Hello Future Apex Hackathon 2026
 */
contract RainSafePool {

    address public owner;

    // ─── Pool Sources ─────────────────────────────────────────────────────────

    enum SourceType { Farmer, ONG, Investor }

    struct Deposit {
        address depositor;
        uint256 amount;
        SourceType sourceType;
        string label;        // "CGIAR", "Mercy Corps", "ESG Fund A", etc.
        uint256 depositedAt;
        uint256 yieldEarned;
    }

    struct PoolStats {
        uint256 totalFromFarmers;
        uint256 totalFromONGs;
        uint256 totalFromInvestors;
        uint256 totalPayouts;
        uint256 totalDeposits;
        uint256 activePolicies;
    }

    mapping(address => Deposit[]) public deposits;
    mapping(address => uint256) public investorBalance;
    address[] public depositors;
    PoolStats public stats;

    // Yield rate for investors (8% annual = ~0.022% daily)
    uint256 public constant ANNUAL_YIELD_BPS = 800; // 8% in basis points
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ─── Events ───────────────────────────────────────────────────────────────

    event PoolFunded(address indexed funder, uint256 amount, SourceType sourceType, string label);
    event PayoutExecuted(address indexed farmer, uint256 amount, string eventType);
    event YieldClaimed(address indexed investor, uint256 amount);
    event PremiumReceived(address indexed farmer, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ─── Funding Functions ────────────────────────────────────────────────────

    // Farmer pays premium
    function payPremium(string memory farmName) external payable {
        require(msg.value > 0, "Premium must be > 0");

        deposits[msg.sender].push(Deposit({
            depositor: msg.sender,
            amount: msg.value,
            sourceType: SourceType.Farmer,
            label: farmName,
            depositedAt: block.timestamp,
            yieldEarned: 0
        }));

        if (investorBalance[msg.sender] == 0) depositors.push(msg.sender);
        stats.totalFromFarmers += msg.value;
        stats.totalDeposits += msg.value;
        stats.activePolicies++;

        emit PremiumReceived(msg.sender, msg.value);
        emit PoolFunded(msg.sender, msg.value, SourceType.Farmer, farmName);
    }

    // ONG or grant funds the pool
    function fundAsONG(string memory organizationName) external payable {
        require(msg.value > 0, "Donation must be > 0");

        deposits[msg.sender].push(Deposit({
            depositor: msg.sender,
            amount: msg.value,
            sourceType: SourceType.ONG,
            label: organizationName,
            depositedAt: block.timestamp,
            yieldEarned: 0
        }));

        if (investorBalance[msg.sender] == 0) depositors.push(msg.sender);
        stats.totalFromONGs += msg.value;
        stats.totalDeposits += msg.value;

        emit PoolFunded(msg.sender, msg.value, SourceType.ONG, organizationName);
    }

    // ESG investor deposits capital expecting yield
    function depositAsInvestor(string memory fundName) external payable {
        require(msg.value > 0, "Deposit must be > 0");

        deposits[msg.sender].push(Deposit({
            depositor: msg.sender,
            amount: msg.value,
            sourceType: SourceType.Investor,
            label: fundName,
            depositedAt: block.timestamp,
            yieldEarned: 0
        }));

        if (investorBalance[msg.sender] == 0) depositors.push(msg.sender);
        investorBalance[msg.sender] += msg.value;
        stats.totalFromInvestors += msg.value;
        stats.totalDeposits += msg.value;

        emit PoolFunded(msg.sender, msg.value, SourceType.Investor, fundName);
    }

    // ─── Payout ───────────────────────────────────────────────────────────────

    function executePayout(
        address payable farmer,
        uint256 amount,
        string memory eventType
    ) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient pool balance");
        stats.totalPayouts += amount;
        farmer.transfer(amount);
        emit PayoutExecuted(farmer, amount, eventType);
    }

    // ─── Yield for investors ──────────────────────────────────────────────────

    function calculateYield(address investor) public view returns (uint256) {
        uint256 totalYield = 0;
        Deposit[] memory deps = deposits[investor];
        for (uint i = 0; i < deps.length; i++) {
            if (deps[i].sourceType == SourceType.Investor) {
                uint256 daysDeposited = (block.timestamp - deps[i].depositedAt) / 86400;
                uint256 dailyYield = (deps[i].amount * ANNUAL_YIELD_BPS) / BPS_DENOMINATOR / 365;
                totalYield += dailyYield * daysDeposited;
            }
        }
        return totalYield;
    }

    function claimYield() external {
        uint256 yield = calculateYield(msg.sender);
        require(yield > 0, "No yield to claim");
        require(address(this).balance >= yield, "Insufficient pool for yield");
        payable(msg.sender).transfer(yield);
        emit YieldClaimed(msg.sender, yield);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    function getPoolBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getPoolStats() external view returns (PoolStats memory) {
        return stats;
    }

    function getCapacityInfo() external view returns (
        uint256 balance,
        uint256 maxCoverage,
        uint256 utilizationPct
    ) {
        balance = address(this).balance;
        maxCoverage = balance * 10; // 10x leverage ratio
        utilizationPct = stats.totalDeposits > 0
            ? (stats.totalPayouts * 100) / stats.totalDeposits
            : 0;
    }

    receive() external payable {}
}

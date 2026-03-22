// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * RainSafePool v2 — Multi-source Insurance Pool with Protocol Fee
 * Hedera Hello Future Apex Hackathon 2026
 *
 * Capital structure:
 *   Tier 1 — ONGs/Grants (first loss, on-chain impact reports)
 *   Tier 2 — ESG Investors (~8% yield)
 *   Tier 3 — Farmer Premiums (continuous flow)
 *
 * Protocol fee: 3% on all premiums + yield spread
 */
contract RainSafePool {

    // ─── Constants ────────────────────────────────────────────────────────────
    uint256 public constant PROTOCOL_FEE_BPS = 300;     // 3% on premiums
    uint256 public constant INVESTOR_YIELD_BPS = 800;   // 8% annual to investors
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    // ─── Structs ──────────────────────────────────────────────────────────────
    struct Investor {
        uint256 amount;
        uint256 depositedAt;
        uint256 lastYieldClaim;
        bool active;
    }

    struct ONG {
        uint256 amount;
        uint256 fundedAt;
        uint256 impactScore;  // number of farmers protected by this funding
        bool active;
    }

    struct PremiumRecord {
        address farmer;
        uint256 amount;
        uint256 fee;
        uint256 net;
        uint256 paidAt;
    }

    struct PayoutRecord {
        address farmer;
        uint256 amount;
        uint256 fee;
        uint256 net;
        uint256 executedAt;
        string eventType;
    }

    // ─── State ────────────────────────────────────────────────────────────────
    address public owner;
    address public feeRecipient;

    mapping(address => Investor) public investors;
    mapping(address => ONG) public ongs;
    address[] public investorList;
    address[] public ongList;

    PremiumRecord[] public premiumHistory;
    PayoutRecord[] public payoutHistory;

    uint256 public tier1Balance;   // ONG funds
    uint256 public tier2Balance;   // Investor funds
    uint256 public tier3Balance;   // Net premiums
    uint256 public totalFees;
    uint256 public totalPremiums;
    uint256 public totalPayouts;
    uint256 public farmersProtected;

    // ─── Events ───────────────────────────────────────────────────────────────
    event PremiumPaid(address indexed farmer, uint256 gross, uint256 fee, uint256 net);
    event ONGFunded(address indexed ong, uint256 amount);
    event InvestorDeposited(address indexed investor, uint256 amount);
    event PayoutExecuted(address indexed farmer, uint256 gross, uint256 fee, uint256 net, string eventType);
    event YieldClaimed(address indexed investor, uint256 amount);
    event ImpactReportGenerated(uint256 farmersProtected, uint256 totalPayouts, uint256 timestamp);

    modifier onlyOwner() { require(msg.sender == owner, "Not authorized"); _; }

    constructor(address _feeRecipient) {
        owner = msg.sender;
        feeRecipient = _feeRecipient;
    }

    // ─── Tier 3: Farmer Premiums ──────────────────────────────────────────────

    /**
     * @notice Farmer pays premium. 3% fee deducted automatically.
     */
    function payPremium() external payable {
        require(msg.value > 0, "Premium required");

        uint256 fee = (msg.value * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
        uint256 net = msg.value - fee;

        // Send fee to protocol treasury
        if (fee > 0 && feeRecipient != address(0)) {
            (bool sent,) = feeRecipient.call{value: fee}("");
            require(sent, "Fee transfer failed");
        }

        tier3Balance += net;
        totalFees += fee;
        totalPremiums += msg.value;
        farmersProtected++;

        premiumHistory.push(PremiumRecord({
            farmer: msg.sender,
            amount: msg.value,
            fee: fee,
            net: net,
            paidAt: block.timestamp
        }));

        emit PremiumPaid(msg.sender, msg.value, fee, net);
    }

    // ─── Tier 1: ONG / Grant ──────────────────────────────────────────────────

    function fundAsONG() external payable {
        require(msg.value > 0, "Funding required");
        if (!ongs[msg.sender].active) {
            ongList.push(msg.sender);
        }
        ongs[msg.sender].amount += msg.value;
        ongs[msg.sender].fundedAt = block.timestamp;
        ongs[msg.sender].active = true;

        tier1Balance += msg.value;
        emit ONGFunded(msg.sender, msg.value);
    }

    // ─── Tier 2: ESG Investor ─────────────────────────────────────────────────

    function depositAsInvestor() external payable {
        require(msg.value > 0, "Deposit required");
        if (!investors[msg.sender].active) {
            investorList.push(msg.sender);
            investors[msg.sender].depositedAt = block.timestamp;
            investors[msg.sender].lastYieldClaim = block.timestamp;
        }
        investors[msg.sender].amount += msg.value;
        investors[msg.sender].active = true;
        tier2Balance += msg.value;
        emit InvestorDeposited(msg.sender, msg.value);
    }

    /**
     * @notice Investor claims accrued yield (~8% annual)
     */
    function claimYield() external {
        Investor storage inv = investors[msg.sender];
        require(inv.active && inv.amount > 0, "Not an active investor");

        uint256 elapsed = block.timestamp - inv.lastYieldClaim;
        uint256 annualYield = (inv.amount * INVESTOR_YIELD_BPS) / BPS_DENOMINATOR;
        uint256 yield = (annualYield * elapsed) / SECONDS_PER_YEAR;

        require(yield > 0, "No yield to claim");
        require(address(this).balance >= yield, "Insufficient pool balance");

        inv.lastYieldClaim = block.timestamp;
        (bool sent,) = payable(msg.sender).call{value: yield}("");
        require(sent, "Yield transfer failed");

        emit YieldClaimed(msg.sender, yield);
    }

    /**
     * @notice Returns pending yield for an investor
     */
    function pendingYield(address _investor) external view returns (uint256) {
        Investor memory inv = investors[_investor];
        if (!inv.active || inv.amount == 0) return 0;
        uint256 elapsed = block.timestamp - inv.lastYieldClaim;
        uint256 annualYield = (inv.amount * INVESTOR_YIELD_BPS) / BPS_DENOMINATOR;
        return (annualYield * elapsed) / SECONDS_PER_YEAR;
    }

    // ─── Payouts ──────────────────────────────────────────────────────────────

    /**
     * @notice Execute payout to farmer. Drains Tier 1 first, then Tier 2, then Tier 3.
     * @dev 3% fee deducted from payout.
     */
    function executePayout(
        address payable _farmer,
        uint256 _grossAmount,
        string memory _eventType
    ) external onlyOwner {
        require(address(this).balance >= _grossAmount, "Insufficient pool");

        uint256 fee = (_grossAmount * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
        uint256 net = _grossAmount - fee;

        // Drain tiers in order: Tier1 → Tier2 → Tier3
        if (tier1Balance >= _grossAmount) {
            tier1Balance -= _grossAmount;
        } else if (tier1Balance + tier2Balance >= _grossAmount) {
            uint256 remaining = _grossAmount - tier1Balance;
            tier1Balance = 0;
            tier2Balance -= remaining;
        } else {
            tier1Balance = 0;
            tier2Balance = 0;
            tier3Balance = (tier3Balance >= (_grossAmount - tier1Balance - tier2Balance))
                ? tier3Balance - (_grossAmount - tier1Balance - tier2Balance)
                : 0;
        }

        totalPayouts += net;
        totalFees += fee;

        // Update ONG impact scores
        for (uint256 i = 0; i < ongList.length; i++) {
            ongs[ongList[i]].impactScore++;
        }

        if (fee > 0 && feeRecipient != address(0)) {
            (bool feeSent,) = feeRecipient.call{value: fee}("");
            if (!feeSent) {}
        }

        (bool payoutSent,) = _farmer.call{value: net}("");
        require(payoutSent, "Payout failed");

        payoutHistory.push(PayoutRecord({
            farmer: _farmer,
            amount: _grossAmount,
            fee: fee,
            net: net,
            executedAt: block.timestamp,
            eventType: _eventType
        }));

        emit PayoutExecuted(_farmer, _grossAmount, fee, net, _eventType);
    }

    // ─── Impact Reports ───────────────────────────────────────────────────────

    /**
     * @notice Emit on-chain impact report for ONGs and ESG reports
     */
    function emitImpactReport() external {
        emit ImpactReportGenerated(farmersProtected, totalPayouts, block.timestamp);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    function getPoolStats() external view returns (
        uint256 t1, uint256 t2, uint256 t3,
        uint256 fees, uint256 premiums, uint256 payouts,
        uint256 farmers, uint256 total
    ) {
        return (
            tier1Balance, tier2Balance, tier3Balance,
            totalFees, totalPremiums, totalPayouts,
            farmersProtected, address(this).balance
        );
    }

    function getInvestorInfo(address _investor) external view returns (Investor memory) {
        return investors[_investor];
    }

    function getONGInfo(address _ong) external view returns (ONG memory) {
        return ongs[_ong];
    }

    function getPremiumCount() external view returns (uint256) { return premiumHistory.length; }
    function getPayoutCount() external view returns (uint256) { return payoutHistory.length; }

    function updateFeeRecipient(address _new) external onlyOwner { feeRecipient = _new; }

    receive() external payable { tier3Balance += msg.value; }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}

contract TokenVesting {
    IERC20 public token;
    address public beneficiary;
    uint256 public start;
    uint256 public cliff;
    uint256 public duration;
    uint256 public interval;
    uint256 public released;
    uint256 public totalAmount;

    event TokensReleased(address indexed beneficiary, uint256 amount);

    constructor(
        address _token,
        address _beneficiary,
        uint256 _start,
        uint256 _cliffDurationInMonths,
        uint256 _totalVestingDurationInMonths,
        uint256 _amount
    ) {
        require(_token != address(0), "Token address cannot be zero");
        require(_beneficiary != address(0), "Beneficiary address cannot be zero");
        require(
            _cliffDurationInMonths <= _totalVestingDurationInMonths,
            "Cliff duration must be less than or equal to total vesting duration"
        );
        require(_amount > 0, "Total amount must be greater than zero");
        require(_totalVestingDurationInMonths > 0, "Total vesting duration must be greater than zero");

        token = IERC20(_token);
        beneficiary = _beneficiary;
        start = _start;
        cliff = _start + (_cliffDurationInMonths * 30 days); // Convert months to seconds
        duration = _totalVestingDurationInMonths * 30 days; // Convert months to seconds
        interval = 90 days; // 3 months in seconds
        totalAmount = _amount;
    }

    function release() external {
        require(block.timestamp >= cliff, "Cliff period not reached");
        uint256 unreleased = releasableAmount();
        require(unreleased > 0, "No tokens to release");

        released += unreleased;
        emit TokensReleased(beneficiary, unreleased);
        require(token.transfer(beneficiary, unreleased), "Token transfer failed");
    }

    function releasableAmount() public view returns (uint256) {
        return vestedAmount() - released;
    }

    function vestedAmount() public view returns (uint256) {
        if (block.timestamp < cliff) {
            return 0;
        } else if (block.timestamp >= start + duration) {
            return totalAmount;
        } else {
            uint256 elapsedTime = block.timestamp - start;
            uint256 vestedIntervals = elapsedTime / interval;
            uint256 totalIntervals = duration / interval;
            return (totalAmount * vestedIntervals) / totalIntervals;
        }
    }
}

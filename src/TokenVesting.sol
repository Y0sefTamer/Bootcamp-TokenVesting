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
}

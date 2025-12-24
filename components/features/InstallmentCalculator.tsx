"use client";
import { useState, useEffect, useMemo } from "react";

interface InstallmentCalculatorProps {
  accountPrice: number | string;
  downPayment: string;
  setDownPayment: (value: string) => void;
  installmentMonths: number;
  setInstallmentMonths: (value: number) => void;
}

export const InstallmentCalculator = ({
  accountPrice,
  downPayment,
  setDownPayment,
  installmentMonths,
  setInstallmentMonths,
}: InstallmentCalculatorProps) => {
  // Parse account price
  const parsePrice = (price: number | string): number => {
    if (typeof price === 'number') {
      return price;
    }
    // Remove 'k', 'K', commas, and dots, then parse
    const priceStr = String(price).replace(/k|K|,|\./g, '');
    return parseFloat(priceStr) || 0;
  };

  const totalPrice = parsePrice(accountPrice);
  const minDownPayment = totalPrice * 0.3; // 30% minimum

  // Calculate installment details with monthly reducing balance interest
  const installmentDetails = useMemo(() => {
    const downPaymentNum = parseFloat(downPayment) || 0;
    
    // Validate minimum down payment
    if (downPaymentNum < minDownPayment) {
      return null;
    }

    const remainingAmount = totalPrice - downPaymentNum;
    
    // Determine interest rate based on months
    let monthlyInterestRate = 0;
    if (installmentMonths >= 1 && installmentMonths <= 2) {
      monthlyInterestRate = 0.05; // 5% per month
    } else if (installmentMonths >= 3 && installmentMonths <= 6) {
      monthlyInterestRate = 0.07; // 7% per month
    } else if (installmentMonths > 6) {
      monthlyInterestRate = 0.10; // 10% per month for months > 6
    }

    // Calculate monthly payments with reducing balance
    const monthlyPayments: Array<{
      month: number;
      principal: number;
      interest: number;
      total: number;
      remainingBalance: number;
    }> = [];

    let currentBalance = remainingAmount;
    const monthlyPrincipal = remainingAmount / installmentMonths;
    let totalInterest = 0;

    for (let month = 1; month <= installmentMonths; month++) {
      const monthlyInterest = currentBalance * monthlyInterestRate;
      const monthlyTotal = monthlyPrincipal + monthlyInterest;
      totalInterest += monthlyInterest;
      
      monthlyPayments.push({
        month,
        principal: monthlyPrincipal,
        interest: monthlyInterest,
        total: monthlyTotal,
        remainingBalance: currentBalance - monthlyPrincipal,
      });

      currentBalance -= monthlyPrincipal;
    }

    const totalWithInterest = remainingAmount + totalInterest;

    return {
      downPayment: downPaymentNum,
      remainingAmount,
      monthlyInterestRate: Math.round(monthlyInterestRate * 100 * 100) / 100, // Round to 2 decimal places
      totalInterest,
      totalWithInterest,
      monthlyPayments,
    };
  }, [downPayment, installmentMonths, totalPrice, minDownPayment]);

  // Removed auto-set to allow user to input freely

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(Math.ceil(amount));
  };

  return (
    <div className="installment-calculator">
      <div className="installment-inputs">
        {/* Down Payment Input */}
        <div className="installment-input-group">
          <label className="installment-label">
            <span>Số tiền trả trước</span>
            <span className="installment-hint">
              * Tối thiểu: {formatCurrency(minDownPayment)}k VND (30% giá tài khoản)
            </span>
          </label>
          <div className="installment-input-wrapper">
            <input
              type="number"
              value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)}
              min="0"
              max={totalPrice}
              step="100"
              className="installment-input"
              placeholder={`Nhập số tiền trả trước (tối thiểu ${formatCurrency(minDownPayment)}k)...`}
            />
            <span className="installment-input-suffix">k VND</span>
          </div>
          {downPayment && parseFloat(downPayment) > 0 && parseFloat(downPayment) < minDownPayment && (
            <span className="installment-error">
              ⚠️ Số tiền trả trước phải tối thiểu {formatCurrency(minDownPayment)}k VND (30% giá tài khoản)
            </span>
          )}
        </div>

        {/* Installment Months Input */}
        <div className="installment-input-group">
          <label className="installment-label">
            <span>Số tháng trả góp</span>
          </label>
          <div className="installment-months-buttons">
            {[1, 2, 3, 4, 5, 6].map((month) => (
              <button
                key={month}
                type="button"
                onClick={() => setInstallmentMonths(month)}
                className={`installment-month-btn ${
                  installmentMonths === month ? 'active' : ''
                }`}
              >
                {month} tháng
              </button>
            ))}
          </div>
          {/* Custom months input */}
          <div className="installment-input-wrapper mt-3">
            <input
              type="number"
              value={installmentMonths > 6 ? installmentMonths : ''}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value && value > 6) {
                  setInstallmentMonths(value);
                } else if (e.target.value === '') {
                  // Keep current value if input is cleared but don't reset to 0
                }
              }}
              min="7"
              max="24"
              step="1"
              className="installment-input"
              placeholder="Nhập số tháng tùy chỉnh (7-24 tháng)..."
            />
            <span className="installment-input-suffix">tháng</span>
          </div>
          {installmentMonths > 6 && (
            <span className="installment-hint mt-2 block">
              * Lãi suất: 10% / tháng cho {installmentMonths} tháng
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      {installmentDetails && (
        <div className="installment-results">
          <div className="installment-result-header">
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-5m-3 5h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <h3 className="installment-result-title">Kết quả tính toán</h3>
          </div>

          <div className="installment-result-grid">
            <div className="installment-result-item">
              <span className="installment-result-label">Giá tài khoản:</span>
              <span className="installment-result-value">{formatCurrency(totalPrice)}k VND</span>
            </div>

            <div className="installment-result-item">
              <span className="installment-result-label">Trả trước:</span>
              <span className="installment-result-value">{formatCurrency(installmentDetails.downPayment)}k VND</span>
            </div>

            <div className="installment-result-item">
              <span className="installment-result-label">Số tiền còn thiếu:</span>
              <span className="installment-result-value">{formatCurrency(installmentDetails.remainingAmount)}k VND</span>
            </div>

            <div className="installment-result-item highlight">
              <span className="installment-result-label">Lãi suất ({installmentDetails.monthlyInterestRate.toFixed(0)}% / {installmentMonths} tháng):</span>
              <span className="installment-result-value">{formatCurrency(installmentDetails.totalInterest)}k VND</span>
            </div>

            <div className="installment-result-item highlight">
              <span className="installment-result-label">Tổng tiền phải trả (gồm lãi):</span>
              <span className="installment-result-value">{formatCurrency(installmentDetails.totalWithInterest)}k VND</span>
            </div>
          </div>

          {/* Monthly Payment Breakdown */}
          <div className="installment-monthly-breakdown">
            <h4 className="installment-breakdown-title">Chi tiết từng tháng:</h4>
            <div className="installment-breakdown-list">
              {installmentDetails.monthlyPayments.map((payment) => (
                <div key={payment.month} className="installment-breakdown-item">
                  <div className="installment-breakdown-header">
                    <span className="installment-breakdown-month">Tháng {payment.month}</span>
                    <span className="installment-breakdown-total">{formatCurrency(payment.total)}k VND</span>
                  </div>
                  <div className="installment-breakdown-details">
                    <span className="installment-breakdown-detail">
                      Gốc: {formatCurrency(payment.principal)}k
                    </span>
                    <span className="installment-breakdown-detail">
                      Lãi: {formatCurrency(payment.interest)}k
                    </span>
                    <span className="installment-breakdown-detail">
                      Còn lại: {formatCurrency(payment.remainingBalance)}k
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="installment-summary">
            <div className="installment-summary-item">
              <span>Tổng thanh toán:</span>
              <span className="installment-summary-total">
                {formatCurrency(installmentDetails.downPayment + installmentDetails.totalWithInterest)}k VND
              </span>
            </div>
            <div className="installment-summary-note">
              * Lãi được tính hằng tháng trên số tiền gốc còn lại (lãi suất giảm dần)
            </div>
          </div>
        </div>
      )}

      {downPayment && parseFloat(downPayment) >= minDownPayment && !installmentDetails && (
        <div className="installment-error-box">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Vui lòng nhập đầy đủ thông tin để tính toán</span>
        </div>
      )}
    </div>
  );
};


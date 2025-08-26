import express from "express";
import { LoanStatus } from "../src/models";
import { getLoanById, updateLoanById, createTransaction } from "./database";
import { ensureAuthenticated, validateMiddleware }from "./helpers";
import { isLoanPaymentValidator } from "./validators";

const router = express.Router();

router.post(
  "/:loanId/payments",
  ensureAuthenticated,
  validateMiddleware(isLoanPaymentValidator),
  (req, res) => {
    const { loanId } = req.params;
    const userId = req.user!.id;
    const { amount, interestPortion, principalPortion } = req.body;

    const loan = getLoanById(loanId);

    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }

    if (loan.borrowerId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (loan.status !== LoanStatus.active) {
      return res.status(409).json({ error: "Loan is not active" });
    }

    if (principalPortion > loan.outstandingBalance) {
      return res.status(400).json({ error: "Principal portion exceeds outstanding balance" });
    }

    const newOutstandingBalance = loan.outstandingBalance - principalPortion;
    const newStatus = newOutstandingBalance <= 0 ? LoanStatus.paid : LoanStatus.active;

    updateLoanById(loanId, {
      outstandingBalance: newOutstandingBalance,
      status: newStatus,
    });

    createTransaction(userId, "loan_payment", {
      amount,
      description: `Loan payment for loan ${loanId}`,
      receiverId: loan.lenderId,
      senderId: userId,
      source: "loan",
      status: "complete",
      privacyLevel: "private",
    });

    const updatedLoan = getLoanById(loanId);

    res.status(200).json({ loan: updatedLoan });
  }
);

export default router;

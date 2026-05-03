"use client";

import { RefreshCw, AlertCircle, Filter } from "lucide-react";
import { useTransactions, type TokenFilter, type TxTypeFilter } from "@/hooks/useTransactions";
import TransactionTable from "@/components/TransactionTable";
import TxDecoder from "@/components/TxDecoder";

type FilterButtonProps = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function FilterButton({ active, onClick, children }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
        active
          ? "bg-accent/10 text-accent border border-accent/30"
          : "bg-surface-2 text-text-secondary border border-border hover:border-accent/30 hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}

export default function TransactionsPage() {
  const {
    transactions,
    loading,
    error,
    tokenFilter,
    typeFilter,
    setTokenFilter,
    setTypeFilter,
    refresh,
    fetchTxDetail,
  } = useTransactions();

  const TOKEN_FILTERS: { label: string; value: TokenFilter }[] = [
    { label: "All Tokens", value: "all" },
    { label: "mTBILL", value: "mTBILL" },
    { label: "mBASIS", value: "mBASIS" },
  ];

  const TYPE_FILTERS: { label: string; value: TxTypeFilter }[] = [
    { label: "All Types", value: "all" },
    { label: "🟢 Mints", value: "mint" },
    { label: "🔴 Burns", value: "burn" },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            Transaction Monitor
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Live mint &amp; burn events from mTBILL and mBASIS contracts
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="btn-secondary gap-1.5 py-1.5 px-3 text-xs"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-danger/5 border border-danger/20 text-sm text-danger">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>
            <span className="font-medium">Etherscan API error — </span>
            {error}
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Filter size={13} className="text-text-muted" />
          <span className="text-xs text-text-muted font-medium">Token:</span>
          <div className="flex gap-1">
            {TOKEN_FILTERS.map(({ label, value }) => (
              <FilterButton
                key={value}
                active={tokenFilter === value}
                onClick={() => setTokenFilter(value)}
              >
                {label}
              </FilterButton>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text-muted font-medium">Type:</span>
          <div className="flex gap-1">
            {TYPE_FILTERS.map(({ label, value }) => (
              <FilterButton
                key={value}
                active={typeFilter === value}
                onClick={() => setTypeFilter(value)}
              >
                {label}
              </FilterButton>
            ))}
          </div>
        </div>
        {!loading && (
          <span className="ml-auto text-xs text-text-muted">
            {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Transaction table */}
      <TransactionTable
        transactions={transactions}
        loading={loading}
        fetchDetail={fetchTxDetail}
      />

      {/* Decoder */}
      <TxDecoder />
    </div>
  );
}

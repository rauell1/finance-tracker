"use client";

import { useState, useEffect } from "react";
import { 
  HelpCircle, MessageSquare, PlusCircle, AlertCircle, 
  CheckCircle2, Loader2, Send, Clock, BookOpen, User,
  ChevronDown, ChevronUp, Reply, ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type HelpTabType = "faqs" | "submit" | "tickets" | "admin";

interface HelpRequest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: "bug" | "feature" | "question" | "improvement";
  status: "open" | "in_progress" | "resolved" | "closed";
  admin_response: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    role: string;
  };
}

interface FAQItem {
  q: string;
  a: string;
}

const faqs: FAQItem[] = [
  {
    q: "How does the M-Pesa SMS webhook sync work?",
    a: "FinTrack uses a webhook that can receive incoming SMS text data forwarded from your Android device (using automation apps like MacroDroid). When a transaction SMS arrives, the webhook extracts the transaction code, amount, and stated balance to automatically update your dashboard in real-time."
  },
  {
    q: "Why is my M-Pesa balance negative?",
    a: "Under our system rules, M-Pesa (main) accounts are permitted to go negative up to -KES 1,500. This tracks Safaricom's Fuliza overdraft limits. When new funds arrive, Safaricom automatically deducts outstanding Fuliza amounts, which our system reconciles automatically via repayment logs."
  },
  {
    q: "How do I connect my bank accounts?",
    a: "Go to Settings -> Linked Accounts, select your bank (DTB, I&M, or SBM), and input your account details. Since we prioritize privacy and security, we do not store your online banking credentials; instead, we parse official transaction alert SMS messages routed to your webhook token."
  },
  {
    q: "Can I delete or export my financial data?",
    a: "Yes. Go to Settings -> Data Tools. Under this section, you can export your entire transaction history to a CSV file or request permanent account deletion in compliance with GDPR, CCPA, and the Kenya Data Protection Act."
  }
];

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState<HelpTabType>("faqs");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  
  // Submit request form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"bug" | "feature" | "question" | "improvement">("question");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Accordion faq active indexes
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Accordion ticket active IDs
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  // Admin response states
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [adminStatus, setAdminStatus] = useState<string>("open");
  const [adminResponseText, setAdminResponseText] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Load support tickets
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/help");
      if (!res.ok) throw new Error("Failed to load help requests");
      const data = await res.json();
      setRequests(data.requests);
      setIsAdmin(data.isAdmin);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error connecting to support services";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Handle support ticket submission
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category })
      });

      if (!res.ok) throw new Error("Failed to submit request");
      
      toast.success("Request logged successfully! Support has been notified.");
      setTitle("");
      setDescription("");
      setCategory("question");
      
      // Refresh tickets list and switch tab
      await fetchTickets();
      setActiveTab("tickets");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error submitting support ticket";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle admin response submission
  const handleAdminSubmitResponse = async (ticketId: string) => {
    if (adminStatus === "") {
      toast.error("Please select a status.");
      return;
    }

    setSubmittingResponse(true);
    try {
      const res = await fetch(`/api/help/${ticketId}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: adminStatus, response: adminResponseText })
      });

      if (!res.ok) throw new Error("Failed to submit admin response");

      toast.success("Ticket updated successfully!");
      setAdminResponseText("");
      setSelectedTicketId(null);
      
      // Refresh tickets list
      await fetchTickets();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating support ticket";
      toast.error(msg);
    } finally {
      setSubmittingResponse(false);
    }
  };

  // Select ticket for admin panel
  const handleSelectAdminTicket = (ticket: HelpRequest) => {
    setSelectedTicketId(ticket.id);
    setAdminStatus(ticket.status);
    setAdminResponseText(ticket.admin_response || "");
  };

  // Status badge style helper
  const getStatusBadge = (status: string) => {
    const styles = {
      open: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40",
      in_progress: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40",
      resolved: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40",
      closed: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800",
    }[status] || "bg-slate-100 text-slate-700";

    return (
      <span className={cn("text-[10px] px-2.5 py-0.5 rounded-full font-bold border capitalize shrink-0", styles)}>
        {status.replace("_", " ")}
      </span>
    );
  };

  // Category badge style helper
  const getCategoryBadge = (cat: string) => {
    const styles = {
      bug: "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/40",
      feature: "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/40",
      question: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-850 dark:text-slate-300 dark:border-slate-800",
      improvement: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40",
    }[cat] || "bg-slate-100 text-slate-700";

    return (
      <span className={cn("text-[9px] px-2 py-0.5 rounded-md font-bold border uppercase shrink-0 tracking-wider", styles)}>
        {cat}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <HelpCircle className="h-7 w-7 text-primary" />
            Support & suggestions portal
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Browse guides, ask questions, report bugs, or submit ideas to improve FinTrack.
          </p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-2 border-b border-border/30 pb-3">
        {[
          { id: "faqs", label: "Guides & FAQ", icon: BookOpen },
          { id: "submit", label: "Submit Request", icon: PlusCircle },
          { id: "tickets", label: "My Requests", icon: MessageSquare },
          ...(isAdmin ? [{ id: "admin", label: "Admin Tickets Console", icon: ShieldAlert }] : [])
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as HelpTabType)}
              className={cn(
                "h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all",
                active 
                  ? "bg-primary text-white shadow-md shadow-primary/10" 
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tabs Content */}
      <div className="space-y-6">

        {/* TAB 1: FAQ */}
        {activeTab === "faqs" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 border border-border bg-card rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="font-extrabold text-base text-foreground pb-2 border-b border-border/40">
                Frequently Asked Questions
              </h2>

              <div className="space-y-3">
                {faqs.map((faq, index) => {
                  const expanded = expandedFaq === index;
                  return (
                    <div key={index} className="border border-border/40 rounded-2xl bg-secondary/10 overflow-hidden">
                      <button
                        onClick={() => setExpandedFaq(expanded ? null : index)}
                        className="w-full px-5 py-4 text-left flex items-center justify-between text-xs font-bold text-foreground hover:bg-secondary/20 transition-all"
                      >
                        {faq.q}
                        {expanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                      </button>
                      {expanded && (
                        <div className="px-5 pb-4 pt-1 text-xs text-muted-foreground/90 leading-relaxed border-t border-border/20 bg-card">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar guides */}
            <div className="border border-border bg-card rounded-3xl p-6 shadow-sm space-y-4 h-fit">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
                <AlertCircle className="h-4.5 w-4.5 text-primary" />
                Compliance & Privacy
              </h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                FinTrack complies strictly with global and local privacy laws, including the <strong>Kenya Data Protection Act, 2019 (DPA)</strong>, <strong>GDPR</strong>, and <strong>CCPA</strong>.
              </p>
              <ul className="text-[10px] space-y-1 text-muted-foreground font-semibold">
                <li>• Data is stored in secure encrypted containers.</li>
                <li>• SMS parsing is completed entirely server-side.</li>
                <li>• IP addresses in audit logs are masked automatically.</li>
              </ul>
              <div className="border-t border-border/40 pt-3 text-[10px] text-muted-foreground">
                Need details? Review our <a href="/privacy" className="underline font-bold text-primary">Privacy Policy</a> or configure consents in the <a href="/cookie-manager" className="underline font-bold text-primary">Cookie Manager</a>.
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SUBMIT TICKET */}
        {activeTab === "submit" && (
          <div className="max-w-2xl border border-border bg-card rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="font-extrabold text-base text-foreground">Log a Support Request or Suggestion</h2>
              <p className="text-[11px] text-muted-foreground mt-1">
                Encountered a bug? Have a suggestion or general inquiry? Log it below. Our admins will review and resolve it.
              </p>
            </div>

            <form onSubmit={handleSubmitTicket} className="space-y-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "question", label: "Question" },
                    { id: "bug", label: "Bug Report" },
                    { id: "improvement", label: "Improvement Idea" },
                    { id: "feature", label: "Feature Suggest" }
                  ].map((catItem) => (
                    <button
                      key={catItem.id}
                      type="button"
                      onClick={() => setCategory(catItem.id as "bug" | "feature" | "question" | "improvement")}
                      className={cn(
                        "h-10 rounded-xl text-xs font-bold border transition-all",
                        category === catItem.id 
                          ? "bg-primary border-primary text-white shadow-sm" 
                          : "border-border/60 hover:bg-secondary/40 text-muted-foreground"
                      )}
                    >
                      {catItem.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Subject / Title</label>
                <input
                  type="text"
                  placeholder="e.g. M-Pesa webhook sync showing offset balance"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-10 px-3 bg-secondary rounded-xl border border-border/80 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Detailed Description</label>
                <textarea
                  placeholder="Describe your issue or improvement idea in detail. Include any transaction codes or context (no sensitive pins)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="w-full p-3 bg-secondary rounded-xl border border-border/80 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary leading-normal resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/10 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting Support Ticket...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Request
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: USER TICKETS LIST */}
        {activeTab === "tickets" && (
          <div className="border border-border bg-card rounded-3xl p-6 shadow-sm space-y-4">
            <div className="border-b border-border pb-3 flex justify-between items-center">
              <div>
                <h2 className="font-extrabold text-base text-foreground">My Support History</h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">Track your submitted feedback and admin replies.</p>
              </div>
              <span className="text-[10px] bg-secondary px-2.5 py-1 rounded-full font-bold text-muted-foreground select-none">
                {requests.length} Requests
              </span>
            </div>

            {loading && requests.length === 0 ? (
              <div className="py-12 flex justify-center items-center gap-2">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <span className="text-xs font-bold text-muted-foreground">Retrieving support history...</span>
              </div>
            ) : requests.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <MessageSquare className="h-10 w-10 text-muted-foreground/35 mx-auto" />
                <p className="text-xs font-bold text-muted-foreground">You haven&apos;t submitted any support requests yet.</p>
                <button
                  onClick={() => setActiveTab("submit")}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Create your first ticket
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((ticket) => {
                  const expanded = expandedTicket === ticket.id;
                  return (
                    <div key={ticket.id} className="border border-border/40 rounded-2xl bg-secondary/5 overflow-hidden">
                      {/* Ticket header summary */}
                      <button
                        onClick={() => setExpandedTicket(expanded ? null : ticket.id)}
                        className="w-full px-5 py-4 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary/10 transition-colors"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {getCategoryBadge(ticket.category)}
                            <h3 className="text-xs font-bold text-foreground truncate">{ticket.title}</h3>
                          </div>
                          <span className="text-[9px] text-muted-foreground flex items-center gap-1 font-semibold">
                            <Clock className="h-3 w-3" />
                            Logged: {new Date(ticket.created_at).toLocaleString("en-KE", { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {getStatusBadge(ticket.status)}
                          {expanded ? <ChevronUp className="h-4.5 w-4.5 text-muted-foreground" /> : <ChevronDown className="h-4.5 w-4.5 text-muted-foreground" />}
                        </div>
                      </button>

                      {/* Ticket details expanded */}
                      {expanded && (
                        <div className="px-5 pb-5 pt-3 border-t border-border/20 bg-card space-y-4 text-xs">
                          {/* User Description */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              My Detailed Description
                            </span>
                            <p className="bg-secondary/20 p-3 rounded-xl font-medium text-foreground/95 leading-normal whitespace-pre-wrap">
                              {ticket.description}
                            </p>
                          </div>

                          {/* Admin Response */}
                          {ticket.admin_response ? (
                            <div className="space-y-1.5 pl-4 border-l-2 border-primary/40 bg-primary/[0.01] p-3 rounded-r-xl">
                              <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                                <Reply className="h-3.5 w-3.5 rotate-180" />
                                Official Response from FinTrack Support
                              </span>
                              <p className="font-semibold text-foreground/90 leading-normal whitespace-pre-wrap">
                                {ticket.admin_response}
                              </p>
                            </div>
                          ) : (
                            <div className="text-[10px] text-muted-foreground/80 italic pl-4 border-l border-border/40">
                              Awaiting admin response... Support will update status once reviewed.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ADMIN CONSOLE */}
        {activeTab === "admin" && isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Tickets browser list */}
            <div className="lg:col-span-3 border border-border bg-card rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[550px]">
              <div>
                <div className="border-b border-border pb-3 flex justify-between items-center">
                  <div>
                    <h2 className="font-extrabold text-base text-foreground">Global Support Console (Admin)</h2>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Browse and respond to tickets submitted by all system users.</p>
                  </div>
                  <span className="text-[10px] bg-primary/10 px-2.5 py-1 rounded-full font-extrabold text-primary select-none">
                    {requests.length} Global Tickets
                  </span>
                </div>

                <div className="overflow-y-auto pr-1 h-[420px] space-y-3 mt-4">
                  {requests.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-1.5">
                      <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
                      <span className="text-xs font-bold">No global tickets found.</span>
                    </div>
                  ) : (
                    requests.map((ticket) => {
                      const isSelected = selectedTicketId === ticket.id;
                      return (
                        <button
                          key={ticket.id}
                          onClick={() => handleSelectAdminTicket(ticket)}
                          className={cn(
                            "w-full text-left p-3.5 border rounded-2xl flex flex-col gap-2 transition-all",
                            isSelected 
                              ? "border-primary bg-primary/5 shadow-sm" 
                              : "border-border/40 hover:bg-secondary/25 bg-secondary/5"
                          )}
                        >
                          <div className="flex items-center justify-between gap-3 w-full">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {getCategoryBadge(ticket.category)}
                              <span className="text-xs font-bold text-foreground truncate">{ticket.title}</span>
                            </div>
                            {getStatusBadge(ticket.status)}
                          </div>
                          
                          <p className="text-[10px] text-muted-foreground/90 truncate leading-normal">
                            {ticket.description}
                          </p>

                          <div className="flex justify-between items-center text-[9px] text-muted-foreground/60 font-semibold border-t border-border/20 pt-2 mt-1 w-full">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              User: {ticket.profiles?.full_name || "Anonymous User"}
                            </span>
                            <span>
                              {new Date(ticket.created_at).toLocaleDateString("en-KE", { dateStyle: "short", timeStyle: "short" })}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Response Console */}
            <div className="lg:col-span-2 border border-border bg-card rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[550px]">
              {selectedTicketId ? (
                <>
                  <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                    <div className="border-b border-border pb-3">
                      <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Active Ticket Editor</span>
                      <h3 className="font-bold text-xs text-foreground truncate mt-1">
                        {requests.find(r => r.id === selectedTicketId)?.title}
                      </h3>
                    </div>

                    {/* Original ticket details */}
                    <div className="space-y-2 bg-secondary/15 border border-border/30 p-3 rounded-xl text-[11px]">
                      <div className="flex justify-between font-bold text-muted-foreground/80">
                        <span>Submitted By</span>
                        <span>{requests.find(r => r.id === selectedTicketId)?.profiles?.full_name || "Anonymous"}</span>
                      </div>
                      <p className="text-foreground/90 leading-relaxed font-semibold italic bg-card p-2 border border-border/20 rounded">
                        &quot;{requests.find(r => r.id === selectedTicketId)?.description}&quot;
                      </p>
                    </div>

                    {/* Select Status */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Update Ticket Status</label>
                      <select
                        value={adminStatus}
                        onChange={(e) => setAdminStatus(e.target.value)}
                        className="w-full h-10 px-3 bg-secondary rounded-xl border border-border/85 text-xs font-semibold focus:outline-none"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    {/* Admin Response text */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Resolution Response</label>
                      <textarea
                        placeholder="Write support reply or resolution details here..."
                        value={adminResponseText}
                        onChange={(e) => setAdminResponseText(e.target.value)}
                        rows={6}
                        className="w-full p-3 bg-secondary rounded-xl border border-border/80 text-xs font-semibold focus:outline-none leading-normal resize-none"
                      />
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 flex gap-2">
                    <button
                      onClick={() => setSelectedTicketId(null)}
                      className="h-10 px-4 text-xs font-bold bg-secondary hover:bg-secondary/75 text-foreground rounded-xl border border-border/40"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAdminSubmitResponse(selectedTicketId)}
                      disabled={submittingResponse}
                      className="flex-1 h-10 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-primary/10 transition-all disabled:opacity-50"
                    >
                      {submittingResponse ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving Resolution...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Resolve & Submit Response
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <Reply className="h-10 w-10 text-muted-foreground/30" />
                  <span className="text-xs font-bold text-muted-foreground">Select a ticket from the left panel</span>
                  <p className="text-[10px] text-muted-foreground/80 leading-normal max-w-[200px]">
                    Click on any ticket to update its status or reply with a resolution response.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}

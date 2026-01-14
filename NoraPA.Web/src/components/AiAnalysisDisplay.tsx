import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  AlertTriangle,
  Calendar,
  FileText,
  CircleDollarSign,
  Home,
  Star,
  Search,
  ChevronDown,
  User,
  Mail,
  Building2,
  CheckCircle2,
  Sparkles,
  Download,
  ExternalLink,
  Plus,
  Database,
  Clock,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AiAnalysis } from '@/lib/types';

/**
 * Props for the AiAnalysisDisplay component.
 */
interface AiAnalysisDisplayProps {
  /** The full analysis object containing all extracted intelligence sections. */
  analysis: AiAnalysis;
  /** Callback when a task is created from an obligation. */
  onCreateTask?: (action: string) => void;
  /** Callback when a deadline is added to the calendar/planner. */
  onAddDeadline?: (deadline: string) => void;
  /** Callback when a document attachment is downloaded. */
  onDownloadDocument?: (documentName: string) => void;
  /** Callback when a contact is added to the address book. */
  onAddContact?: (contact: any) => void;
  /** Callback when an event is added to the calendar. */
  onAddEvent?: (event: any) => void;
  /** Callback to re-run analysis with specific user instructions. */
  onRetry?: (instructions?: string) => void;
  /** Callback to confirm all extractions and archive the message. */
  onConfirm?: () => void;
}

/**
 * A complex visualization component for displaying structured AI analysis results.
 * Renders multiple collapsible sections (Summary, Obligations, Deadlines, etc.)
 * based on the DeepSeek/OpenAI JSON output schema.
 */
export function AiAnalysisDisplay({
  analysis,
  onCreateTask,
  onAddDeadline,
  onDownloadDocument,
  onAddContact,
  onAddEvent,
  onRetry,
  onConfirm
}: AiAnalysisDisplayProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['summary']));
  const [feedback, setFeedback] = useState('');
  const [ignoredItems, setIgnoredItems] = useState<Set<string>>(new Set());
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  const markAsAdded = (type: string, index: number) => {
    const newSet = new Set(addedItems);
    newSet.add(`${type}-${index}`);
    setAddedItems(newSet);
  };

  const toggleSection = (section: string) => {
    const newOpen = new Set(openSections);
    if (newOpen.has(section)) {
      newOpen.delete(section);
    } else {
      newOpen.add(section);
    }
    setOpenSections(newOpen);
  };

  const handleDiscard = (type: string, index: number) => {
    const id = `${type}-${index}`;
    const newIgnored = new Set(ignoredItems);
    if (newIgnored.has(id)) newIgnored.delete(id);
    else newIgnored.add(id);
    setIgnoredItems(newIgnored);
  };

  const parseAnalysis = (jsonString?: string): any => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch {
      return { raw: jsonString };
    }
  };

  const sections = [
    { key: 'summary', title: 'Summary', data: parseAnalysis(analysis.summary), icon: ClipboardList, color: 'text-blue-400' },
    { key: 'obligations', title: 'Obligations', data: parseAnalysis(analysis.obligationsAnalysis), icon: AlertTriangle, color: 'text-amber-400' },
    { key: 'deadlines', title: 'Deadlines', data: parseAnalysis(analysis.deadlinesAnalysis), icon: Calendar, color: 'text-rose-400' },
    { key: 'documents', title: 'Documents', data: parseAnalysis(analysis.documentsAnalysis), icon: FileText, color: 'text-indigo-400' },
    { key: 'financialRecords', title: 'Financial Records', data: parseAnalysis(analysis.financialRecordsAnalysis), icon: CircleDollarSign, color: 'text-emerald-400' },
    { key: 'lifeDomain', title: 'Life Domain', data: parseAnalysis(analysis.lifeDomainAnalysis), icon: Home, color: 'text-purple-400' },
    { key: 'importance', title: 'Importance', data: parseAnalysis(analysis.importanceAnalysis), icon: Star, color: 'text-yellow-400' },
    { key: 'contacts', title: 'Contacts', data: parseAnalysis(analysis.contactsAnalysis), icon: User, color: 'text-orange-400' },
    { key: 'events', title: 'Calendar Events', data: parseAnalysis(analysis.eventsAnalysis), icon: Calendar, color: 'text-rose-500' },
    { key: 'general', title: 'General Analysis', data: parseAnalysis(analysis.generalAnalysis), icon: Search, color: 'text-slate-400' },
  ];

  const ConfidenceBadge = ({ confidence }: { confidence?: number }) => {
    if (confidence === undefined) return null;
    return (
      <Badge
        variant="outline"
        className={cn(
          "bg-white/5 border-white/10",
          confidence > 80 ? "text-emerald-400" : confidence > 50 ? "text-amber-400" : "text-rose-400"
        )}
      >
        {confidence}% Confidence
      </Badge>
    );
  };

  const renderSectionContent = (section: typeof sections[0]) => {
    const data = section.data;
    if (!data) return <p className="text-white/40 text-sm py-2 italic whitespace-pre-wrap">No insights extracted for this section.</p>;
    if (data.raw) return <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{data.raw}</p>;

    switch (section.key) {
      case 'summary':
        return (
          <div className="space-y-6">
            {data.classification && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-blue-400" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50">Classification</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.classification.type?.map((type: string) => (
                    <Badge key={type} className="bg-blue-500/10 text-blue-400 border-blue-500/20">{type}</Badge>
                  ))}
                  <Badge className={cn(
                    "capitalize",
                    data.classification.importance === 'high' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-white/5 text-white/60 border-white/10"
                  )}>
                    {data.classification.importance} Priority
                  </Badge>
                  <ConfidenceBadge confidence={data.classification.confidence} />
                </div>
                {data.classification.reason && <p className="text-sm text-white/70 leading-relaxed">{data.classification.reason}</p>}
              </div>
            )}
            {data.entities && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-1 w-1 rounded-full bg-indigo-400" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50">Extracted Entities</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.entities.people?.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-white/40">
                        <User className="h-3 w-3" /> People
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {data.entities.people
                          .filter((p: string) => !['me', 'myself', 'i'].includes(p.toLowerCase()))
                          .map((person: string) => (
                            <Badge key={person} variant="outline" className="bg-white/5 border-white/10 text-white/80">
                              {person}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}
                  {data.entities.organizations?.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-white/40">
                        <Building2 className="h-3 w-3" /> Organizations
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {data.entities.organizations.map((org: string) => (
                          <Badge key={org} variant="outline" className="bg-white/5 border-white/10 text-white/80">
                            {org}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {data.entities.identifiers && Object.keys(data.entities.identifiers).length > 0 && (
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <div className="text-xs font-medium text-white/40 mb-2">Technical Identifiers</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4">
                      {Object.entries(data.entities.identifiers).map(([key, value]) => (
                        <div key={key} className="flex flex-col">
                          <span className="text-[10px] text-white/30 truncate">{key}</span>
                          <span className="text-xs text-white/80 font-mono truncate">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case 'obligations':
        return (
          <div className="space-y-3">
            {data.obligations?.map((obligation: any, index: number) => (
              <div
                key={index}
                className={cn(
                  "group bg-white/5 hover:bg-white/10 rounded-2xl p-4 border border-white/5 transition-all text-left",
                  ignoredItems.has(`obligations-${index}`) && "opacity-40 grayscale"
                )}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-1">
                    <p className={cn("font-medium text-white/90", ignoredItems.has(`obligations-${index}`) && "line-through")}>{obligation.action}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/40">
                      {obligation.trigger && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {obligation.trigger}</span>}
                      {obligation.mandatory && <span className="text-rose-400 font-medium font-inter uppercase tracking-wide px-1.5 py-0.5 bg-rose-500/10 rounded-md">Mandatory</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleDiscard('obligations', index)} className="h-7 w-7 rounded-lg hover:bg-white/10">
                        <AlertTriangle className={cn("h-3 w-3", ignoredItems.has(`obligations-${index}`) ? "text-rose-400" : "text-white/20")} />
                      </Button>
                      <ConfidenceBadge confidence={obligation.confidence} />
                    </div>
                    {onCreateTask && !ignoredItems.has(`obligations-${index}`) && (
                      <Button size="sm" variant="ghost" onClick={() => onCreateTask(obligation.action)} className="h-8 rounded-lg bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 border border-white/10">
                        <Plus className="h-3 w-3 mr-1" /> Task
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )) || <p className="text-white/40 text-sm">No obligations detected.</p>}
          </div>
        );
      case 'deadlines':
        return (
          <div className="space-y-3">
            {data.deadlines?.map((deadline: any, index: number) => (
              <div
                key={index}
                className={cn(
                  "group bg-white/5 hover:bg-white/10 rounded-2xl p-4 border border-white/5 transition-all text-left",
                  ignoredItems.has(`deadlines-${index}`) && "opacity-40 grayscale"
                )}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-1">
                    <p className={cn("font-medium text-white/90", ignoredItems.has(`deadlines-${index}`) && "line-through")}>{deadline.description}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/40">
                      {deadline.date && <span className="flex items-center gap-1 text-rose-400 font-medium"><Calendar className="h-3 w-3" /> {deadline.date}</span>}
                      {deadline.critical && <span className="text-white bg-rose-500 px-1.5 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider">Critical</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleDiscard('deadlines', index)} className="h-7 w-7 rounded-lg hover:bg-white/10">
                        <AlertTriangle className={cn("h-3 w-3", ignoredItems.has(`deadlines-${index}`) ? "text-rose-400" : "text-white/20")} />
                      </Button>
                      <ConfidenceBadge confidence={deadline.confidence} />
                    </div>
                    {onAddDeadline && deadline.date && !ignoredItems.has(`deadlines-${index}`) && (
                      <Button size="sm" variant="ghost" onClick={() => onAddDeadline(deadline.date)} className="h-8 rounded-lg bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-400 border border-white/10">
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )) || <p className="text-white/40 text-sm">No deadlines detected.</p>}
          </div>
        );
      case 'documents':
        return (
          <div className="space-y-4">
            {data.documents?.length > 0 && (
              <div className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Attached Items</div>
                {data.documents.map((doc: any, index: number) => (
                  <div key={index} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-indigo-400" />
                          <p className="font-medium text-white/90">{doc.name}</p>
                        </div>
                        <div className="flex gap-3 text-xs text-white/40 ml-6">
                          {doc.type && <span>{doc.type}</span>}
                          {doc.importance === 'high' && <span className="text-rose-400 italic">High Priority</span>}
                        </div>
                        {doc.requiredAction && (
                          <p className="mt-2 text-xs text-indigo-300 ml-6">Action: {doc.requiredAction}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <ConfidenceBadge confidence={doc.confidence} />
                        {onDownloadDocument && (
                          <Button size="sm" variant="outline" onClick={() => onDownloadDocument(doc.name)} className="h-8 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10">
                            <Download className="h-3 w-3 mr-1" /> Download
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {data.links?.length > 0 && (
              <div className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Detected Links</div>
                {data.links.map((link: any, index: number) => (
                  <div key={`link-${index}`} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 overflow-hidden">
                        <p className="font-medium text-white/90 mb-1">{link.description}</p>
                        <p className="text-xs text-blue-400 truncate hover:underline mb-2 cursor-pointer flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" /> {link.url}
                        </p>
                        {link.requiredAction && <p className="text-xs text-white/70 italic">Action: {link.requiredAction}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <ConfidenceBadge confidence={link.confidence} />
                        <Button size="sm" asChild className="h-8 bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20">
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            Visit
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(!data.documents?.length && !data.links?.length) && <p className="text-white/40 text-sm">No documents or links detected.</p>}
          </div>
        );
      case 'financialRecords':
        return (
          <div className="space-y-6">
            {data.coverage && (
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3 ml-1">Financial Analysis</h4>
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <CircleDollarSign className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white/90">
                      {data.coverage.amount ? `${data.coverage.amount} ${data.coverage.currency || ''}` : 'Amount Unknown'}
                    </h3>
                    <p className="text-xs text-white/40">Total Coverage Amount</p>
                  </div>
                </div>
                {data.coverage.conditions?.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-xs font-medium text-white/60 mb-2">Key Conditions:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {data.coverage.conditions.map((condition: string, i: number) => (
                        <div key={i} className="flex gap-2 text-xs text-white/70 bg-white/5 p-2 rounded-lg border border-white/5">
                          <span className="text-emerald-400 font-bold">•</span>
                          {condition}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {data.risk && (
              <div className={cn(
                "rounded-2xl p-4 border transition-all",
                data.risk.level === 'high' ? "bg-rose-500/5 border-rose-500/20" : "bg-emerald-500/5 border-emerald-500/20"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40">Risk Assessment</h4>
                  <Badge variant="outline" className={cn(
                    "capitalize border-none",
                    data.risk.level === 'high' ? "text-rose-400 bg-rose-500/10" : "text-emerald-400 bg-emerald-500/10"
                  )}>
                    {data.risk.level} Risk
                  </Badge>
                </div>
                {data.risk.explanation && <p className="text-sm text-white/80 leading-relaxed font-inter">{data.risk.explanation}</p>}
                <div className="mt-4 flex justify-end">
                  <ConfidenceBadge confidence={data.confidence} />
                </div>
              </div>
            )}
          </div>
        );
      case 'lifeDomain':
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[140px] bg-white/5 rounded-2xl p-4 border border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 block mb-1">Primary Domain</span>
                <span className="text-purple-400 font-semibold">{data.domain || 'Unclassified'}</span>
              </div>
              <div className="flex-1 min-w-[140px] bg-white/5 rounded-2xl p-4 border border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 block mb-1">Subcategory</span>
                <span className="text-white/80 font-semibold">{data.subcategory || 'None'}</span>
              </div>
            </div>

            {data.storageRecommendation && (
              <div className="bg-purple-500/5 rounded-2xl p-4 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-4 text-purple-400">
                  <Database className="h-4 w-4" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider">Storage Recommendation</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Category</p>
                    <p className="text-sm text-white/80">{data.storageRecommendation.category}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Recommended Path</p>
                    <p className="text-sm text-white/80 font-mono text-[11px]">{data.storageRecommendation.subfolder}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Retention Period</p>
                    <p className="text-sm text-white/80">{data.storageRecommendation.retention}</p>
                  </div>
                  {data.storageRecommendation.indexFields?.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Index Data</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {data.storageRecommendation.indexFields.map((field: string) => (
                          <Badge key={field} variant="outline" className="text-[10px] py-0 bg-white/5 border-white/10">{field}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-end mt-2">
              <ConfidenceBadge confidence={data.confidence} />
            </div>
          </div>
        );
      case 'importance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Star className="h-12 w-12 text-yellow-500" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 block mb-1">Impact Level</span>
                <span className="text-lg font-bold text-yellow-400 capitalize">{data.level || 'Neutral'}</span>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Clock className="h-12 w-12 text-blue-500" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 block mb-1">Time Urgency</span>
                <span className="text-lg font-bold text-blue-400 capitalize">{data.urgency || 'Normal'}</span>
              </div>
            </div>

            {data.factors?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1 mt-2">Key Drivers</h4>
                <div className="space-y-2">
                  {data.factors.map((factor: string, i: number) => (
                    <div key={i} className="flex gap-3 text-sm text-white/70 bg-white/5 p-3 rounded-xl border border-white/5 items-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                      {factor}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end mt-2">
              <ConfidenceBadge confidence={data.confidence} />
            </div>
          </div>
        );
      case 'general':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.missingItems?.length > 0 && (
                <div className="bg-orange-500/5 rounded-2xl p-4 border border-orange-500/20">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-400/70 mb-3 flex items-center gap-2">
                    <Search className="h-3 w-3" /> Missing Insights
                  </h4>
                  <ul className="space-y-2">
                    {data.missingItems.map((item: string, i: number) => (
                      <li key={i} className="text-xs text-white/70 flex gap-2">
                        <span className="text-orange-400 font-bold">?</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.assumptions?.length > 0 && (
                <div className="bg-yellow-500/5 rounded-2xl p-4 border border-yellow-500/20">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-yellow-400/70 mb-3 flex items-center gap-2">
                    <Sparkles className="h-3 w-3" /> AI Assumptions
                  </h4>
                  <ul className="space-y-2">
                    {data.assumptions.map((item: string, i: number) => (
                      <li key={i} className="text-xs text-white/70 flex gap-2">
                        <span className="text-yellow-400 font-bold">≈</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-3">
                {data.followUpNeeded && (
                  <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse">
                    Follow-up Recommended
                  </Badge>
                )}
              </div>
              <ConfidenceBadge confidence={data.confidence} />
            </div>
          </div>
        );
      case 'contacts':
        return (
          <div className="space-y-3">
            {data.contacts?.map((contact: any, index: number) => (
              <div key={index} className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/10 transition-all group">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-1">
                    <p className="font-bold text-white/90">{contact.name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/40">
                      {contact.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {contact.email}</span>}
                      {contact.phone && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {contact.phone}</span>}
                    </div>
                    {contact.organization && (
                      <p className="text-xs text-indigo-400/80 mt-1">{contact.organization} {contact.title ? `• ${contact.title}` : ''}</p>
                    )}
                  </div>
                  {onAddContact && (
                    <Button
                      onClick={() => {
                        onAddContact(contact);
                        markAsAdded('contact', index);
                      }}
                      disabled={addedItems.has(`contact-${index}`)}
                      className={cn(
                        "h-8 rounded-xl border transition-all shadow-lg",
                        addedItems.has(`contact-${index}`)
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500 hover:text-white shadow-orange-500/10"
                      )}
                    >
                      {addedItems.has(`contact-${index}`) ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Saved
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3 mr-1" /> Add Contact
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )) || <p className="text-white/40 text-sm">No new contacts detected.</p>
            }
          </div >
        );
      case 'events':
        return (
          <div className="space-y-3">
            {data.events?.map((event: any, index: number) => (
              <div key={index} className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/10 transition-all group">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-1">
                    <p className="font-bold text-white/90">{event.title}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/40">
                      <span className="flex items-center gap-1 text-rose-400 font-medium">
                        <Calendar className="h-3 w-3" />
                        {new Date(event.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                      {event.location && <span className="flex items-center gap-1"><Home className="h-3 w-3" /> {event.location}</span>}
                    </div>
                    {event.description && <p className="text-xs text-white/30 line-clamp-1">{event.description}</p>}
                  </div>
                  {onAddEvent && (
                    <Button
                      size="sm"
                      onClick={() => onAddEvent(event)}
                      className="h-8 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/10"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Save Event
                    </Button>
                  )}
                </div>
              </div>
            )) || <p className="text-white/40 text-sm">No events detected.</p>}
          </div>
        );
      default:
        return <pre className="text-xs font-mono text-white/40 bg-black/20 p-4 rounded-xl overflow-auto border border-white/5">{JSON.stringify(data, null, 2)}</pre>;
    }
  };

  if (analysis.status === 'processing') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-12 rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center space-y-6 text-center"
      >
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-2 border-indigo-500/20 animate-[spin_3s_linear_infinite]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-indigo-400 animate-spin" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-xl"
          />
        </div>
        <div className="space-y-2">
          <h4 className="text-lg font-bold text-white tracking-tight">Neural Sync in Progress</h4>
          <p className="text-xs text-white/40 max-w-[200px] leading-relaxed">
            Nora is currently decoding the message context and mapping entities...
          </p>
        </div>
      </motion.div>
    );
  }

  if (analysis.status === 'failed') {
    const errorData = parseAnalysis(analysis.rawResponse);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 rounded-[2rem] bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/20 space-y-6"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
            <AlertTriangle className="h-6 w-6 text-rose-400" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-rose-400">Neural Engine Failure</h4>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Error Trace Detected</p>
          </div>
        </div>

        <div className="bg-black/40 rounded-2xl p-4 border border-white/5 font-mono text-[11px] leading-relaxed text-rose-200/70 overflow-hidden">
          <p className="line-clamp-3">{errorData?.error || 'An unexpected interruption occurred during the analysis phase.'}</p>
        </div>

        {errorData?.suggestion && (
          <div className="flex gap-3 items-start bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10">
            <Sparkles className="h-4 w-4 text-rose-400 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-rose-300">Nora's Resolution Path:</p>
              <p className="text-[11px] text-rose-200/60 leading-normal">{errorData.suggestion}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onRetry}
            className="flex-1 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-bold py-6 text-xs shadow-lg shadow-rose-500/20"
          >
            Retry Neural Analysis
          </Button>
          <Button
            onClick={() => window.location.href = '/settings'}
            variant="outline"
            className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white/60 font-bold py-6 px-8 text-xs"
          >
            Open Settings
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white/90 font-inter tracking-tight">Intelligence Report</h3>
            <p className="text-xs text-white/40">Processed via Neural Analysis Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {analysis.modelUsed && (
            <Badge variant="outline" className="rounded-lg px-2 py-0.5 text-[9px] font-bold text-white/40 border-white/10 uppercase tracking-tighter">
              {analysis.modelUsed}
            </Badge>
          )}
          <Badge className={cn(
            "rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-widest border-none",
            analysis.status === 'completed' ? "bg-emerald-500/10 text-emerald-400" :
              analysis.status === 'failed' ? "bg-rose-500/10 text-rose-400" :
                "bg-blue-500/10 text-blue-400"
          )}>
            {analysis.status}
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        {sections.map((section, idx) => (
          <motion.div
            key={section.key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={cn(
              "rounded-2xl border transition-all duration-300",
              openSections.has(section.key)
                ? "bg-white/[0.03] border-white/10 ring-1 ring-white/5"
                : "bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
            )}
          >
            <button
              onClick={() => toggleSection(section.key)}
              className="w-full flex items-center justify-between p-4 group"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300",
                  openSections.has(section.key) ? "bg-white/10 scale-110 shadow-lg" : "bg-white/5 group-hover:bg-white/10",
                  section.color
                )}>
                  <section.icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <span className={cn(
                    "block font-semibold transition-colors duration-300",
                    openSections.has(section.key) ? "text-white/90" : "text-white/60 group-hover:text-white/80"
                  )}>
                    {section.title}
                  </span>
                  {!openSections.has(section.key) && section.data?.confidence && (
                    <span className="text-[10px] text-white/30 uppercase tracking-wider font-bold">
                      {section.data.confidence}% Score
                    </span>
                  )}
                </div>
              </div>
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 border border-transparent",
                openSections.has(section.key) ? "bg-white/10 rotate-180 border-white/10" : "bg-white/5 group-hover:bg-white/10"
              )}>
                <ChevronDown className="h-4 w-4 text-white/40" />
              </div>
            </button>
            <AnimatePresence>
              {openSections.has(section.key) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 pt-2 border-t border-white/5">
                    {renderSectionContent(section)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {analysis.status === 'completed' && (
        <div className="space-y-4">
          {/* Refinement Box */}
          <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40">Neural Core Refinement</h4>
            </div>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Give Nora feedback... (e.g. 'This is a bill, not an insurance policy. Re-calculate deadlines.')"
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40 min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button
                onClick={() => onRetry?.(feedback)}
                disabled={!feedback.trim()}
                className="rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 h-10 text-[10px] font-black uppercase tracking-widest px-6"
              >
                Refine Intelligence
              </Button>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <CheckCircle2 className="h-24 w-24 text-white" />
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="font-bold text-white/90 flex items-center gap-2 justify-center sm:justify-start">
                  {ignoredItems.size > 0 ? 'Selection Refined' : 'Analysis Certified'} <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </h4>
                <p className="text-sm text-white/40">
                  {ignoredItems.size > 0
                    ? `Applying intelligence with ${ignoredItems.size} items discarded.`
                    : 'Neural Engine processed all parameters successfully.'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white/60 border-none px-6">
                  Archive
                </Button>
                <Button
                  onClick={onConfirm}
                  className="rounded-2xl bg-indigo-500 hover:bg-indigo-600 shadow-xl shadow-indigo-500/20 px-8"
                >
                  {ignoredItems.size > 0 ? 'Confirm Selection' : 'Confirm All'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

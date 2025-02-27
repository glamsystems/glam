"use client";

import { EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useGlamClient } from "@/providers/clientProvider";
import { toast } from "./ui/use-toast";
import { ExplorerLink } from "./ExplorerLink";
import { parseTxError } from "@/lib/error";

const PROPOSALS_LIMIT = 9999;
const DEFAULT_PROPOSAL = {
  title: "Proposal",
};
const OPTION_VOTE_DECIMALS = 0;

interface Proposal {
  key: string;
  title: string;
  link: string;
  options: string[];
  index: number;
  proposer: string;
  optionVotes: string[];
  canceledAt: string | null;
  createdAt: string;
  activatedAt: string;
  votingEndsAt: string;
  queuedAt: string | null;
  type: number;
}

type ProposalStatus = "inactive" | "active" | "completed" | "canceled";

const fetchProposals = async (): Promise<Proposal[]> => {
  const maxRetries = 3;
  let retryCount = 0;

  const controller = new AbortController();
  const signal = controller.signal;

  while (retryCount < maxRetries) {
    try {
      console.log(
        `Fetching proposals (attempt ${retryCount + 1}/${maxRetries})`,
      );
      const response = await fetch(
        `https://api.glam.systems/v0/governance/proposals/jupiter?limit=${PROPOSALS_LIMIT}`,
        {
          signal,
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch proposals (attempt ${
            retryCount + 1
          }/${maxRetries}): ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected API response format");
      }

      return data.sort(
        (a: Proposal, b: Proposal) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } catch (error) {
      retryCount++;

      console.error(
        `Error in fetchProposals (attempt ${retryCount}/${maxRetries}):`,
        {
          error,
          message: (error as any).message,
        },
      );

      if (retryCount === maxRetries) {
        throw error;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, retryCount) * 1000),
      );
    } finally {
      controller.abort();
    }
  }

  throw new Error("Failed to fetch proposals after maximum retries");
};

const getProposalStatus = (
  activatedAt: string | null,
  votingEndsAt: string | null,
  canceledAt: string | null,
): ProposalStatus => {
  if (canceledAt) return "canceled";
  if (!activatedAt || !votingEndsAt) return "inactive";

  const now = Date.now();
  const activationDate = new Date(activatedAt).getTime();
  const endDate = new Date(votingEndsAt).getTime();

  if (now < activationDate) return "inactive";
  if (now > endDate) return "completed";
  return "active";
};

const getBadgeVariant = (status: ProposalStatus) => {
  switch (status) {
    case "active":
      return "default";
    case "completed":
      return "secondary";
    case "inactive":
      return "outline";
    case "canceled":
      return "secondary";
  }
};

// Helper function moved outside component to prevent recreation on each render
const formatDate = (dateString: string | null) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
};

// Create a memoized ProposalItem component
const ProposalItem = memo(
  ({
    proposal,
    selectedVotes,
    onVoteChange,
  }: {
    proposal: Proposal;
    selectedVotes: Record<string, string>;
    onVoteChange: (key: string, value: string) => void;
  }) => {
    const { glamClient } = useGlamClient();
    const [isVoting, setIsVoting] = useState(false);
    const [localVoteSelection, setLocalVoteSelection] = useState<string | null>(
      null,
    );

    const handleOverrideVote = useCallback(async () => {
      // Determine the selected option from the local state first, then fallback to fetched votes
      const selectedOption = localVoteSelection || selectedVotes[proposal.key];
      console.log("Override Vote:", {
        proposal: {
          key: proposal.key,
          title: proposal.title,
        },
        selectedOption,
      });
      if (!selectedOption) {
        toast({
          title: "Vote side not selected",
          description: "Please select a vote side",
          variant: "destructive",
        });
        return;
      }

      setIsVoting(true);
      try {
        const txSig = await glamClient.castVote(
          proposal.key,
          parseInt(selectedOption),
        );
        toast({
          title: `Vote succeeded`,
          description: <ExplorerLink path={`tx/${txSig}`} label={txSig} />,
        });
      } catch (error) {
        toast({
          title: `Vote failed`,
          description: parseTxError(error),
          variant: "destructive",
        });
      } finally {
        setIsVoting(false);
      }
    }, [proposal, selectedVotes, localVoteSelection]);

    const status = useMemo(
      () =>
        getProposalStatus(
          proposal.activatedAt,
          proposal.votingEndsAt,
          proposal.canceledAt,
        ),
      [proposal.activatedAt, proposal.votingEndsAt, proposal.canceledAt],
    );

    const parsedOptionVotes = proposal.optionVotes.map((vote) =>
      parseFloat(vote),
    );
    const totalVotes = parsedOptionVotes.reduce((sum, votes) => sum + votes, 0);
    const optionsWithVotes = proposal.options.map((option, index) => ({
      option,
      votes: parsedOptionVotes[index],
      percentage:
        totalVotes > 0
          ? ((parsedOptionVotes[index] / totalVotes) * 100).toFixed(2)
          : "0.00",
      index,
    }));

    optionsWithVotes.sort((a, b) => b.votes - a.votes);

    return (
      <AccordionItem
        key={proposal.key}
        value={proposal.key}
        className="border-0 group"
      >
        <div className="bg-accent rounded-lg">
          {status === "canceled" ? (
            <div className="px-3 py-2">
              <div className="flex items-center justify-between gap-x-4">
                <div className="flex-1 min-w-0">
                  <h3 className="select-none font-semibold max-w-28 sm:max-w-48 text-base truncate text-left text-muted-foreground">
                    {proposal.title || DEFAULT_PROPOSAL.title}
                  </h3>
                </div>
                <div className="flex items-center gap-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Badge
                            variant={getBadgeVariant(status)}
                            className={`select-none text-xs h-6 font-medium rounded-full shadow-none pointer-events-none text-muted-foreground ${
                              getBadgeVariant(status) === "default"
                                ? "text-foreground dark:text-background"
                                : ""
                            }`}
                          >
                            Canceled
                          </Badge>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="bg-background border text-foreground border-border">
                        <p className="text-xs">
                          <span className="font-bold">Canceled at:</span>{" "}
                          {formatDate(proposal.canceledAt)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          ) : (
            <>
              <AccordionTrigger className="select-none px-3 py-2 hover:no-underline [&[data-state=open]>div]:rounded-b-none">
                <div className="flex items-center justify-between gap-x-4 w-full">
                  <div className="flex-1 min-w-0">
                    <h3 className="select-none font-semibold max-w-28 sm:max-w-48 text-base truncate text-left transition-all group-data-[state=open]:opacity-10">
                      {proposal.title || DEFAULT_PROPOSAL.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Badge
                              variant={getBadgeVariant(status)}
                              className={`text-xs h-6 rounded-full shadow-none pointer-events-none ${
                                getBadgeVariant(status) === "default"
                                  ? "text-foreground dark:text-background"
                                  : ""
                              }`}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Badge>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="bg-background border text-foreground border-border">
                          <p className="text-xs">
                            <span className="font-bold">Start:</span>{" "}
                            {formatDate(proposal.activatedAt)}
                          </p>
                          <p className="text-xs">
                            <span className="font-bold">End:</span>{" "}
                            {formatDate(proposal.votingEndsAt)}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <EllipsisHorizontalIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 mr-4" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="bg-background text-foreground border border-border">
                          Not voted
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3 select-none">
                <hr className="mb-4 opacity-20" />
                <div className="space-y-3">
                  <div>
                    <h3 className="select-none text-base font-medium mb-1">
                      {proposal.title || DEFAULT_PROPOSAL.title}
                    </h3>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground space-y-1 mb-6">
                      <p>
                        <b>Start:</b> {formatDate(proposal.activatedAt)}
                      </p>
                      <p>
                        <b>End:</b> {formatDate(proposal.votingEndsAt)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <RadioGroup
                      value={
                        localVoteSelection || selectedVotes[proposal.key] || ""
                      }
                      onValueChange={(value) => {
                        onVoteChange(proposal.key, value);
                        setLocalVoteSelection(value);
                      }}
                      className={`space-y-2 mb-6 ${status === "active" ? "cursor-pointer" : "[&:disabled]:cursor-default"}`}
                      disabled={status !== "active"}
                    >
                      {optionsWithVotes.map((optionData) => (
                        <div
                          key={optionData.index}
                          className="flex items-center justify-between space-x-2 flex-col sm:flex-row"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              className={
                                status === "active" ? "" : "pointer-events-none"
                              }
                              checked={
                                (localVoteSelection ||
                                  selectedVotes[proposal.key]) ===
                                optionData.index.toString()
                              }
                              value={optionData.index.toString()}
                              id={`${proposal.key}-${optionData.index}`}
                              disabled={status !== "active"}
                            />
                            <label
                              htmlFor={`${proposal.key}-${optionData.index}`}
                              className="w-56 text-sm font-normal peer-disabled:cursor-default peer-disabled:opacity-70 select-none truncate"
                            >
                              {optionData.option}
                            </label>
                          </div>
                          <span className="text-xs text-muted-foreground select-none font-mono opacity-0 sm:opacity-100 text-nowrap">
                            {Number(
                              optionData.votes.toFixed(OPTION_VOTE_DECIMALS),
                            ).toLocaleString()}{" "}
                            ({optionData.percentage}%)
                          </span>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div className="flex gap-4 flex-col sm:flex-row">
                    <Link
                      href={proposal.link}
                      target="_blank"
                      className="w-full"
                    >
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-background hover:bg-muted text-foreground shadow-none w-full"
                      >
                        View Full Details
                      </Button>
                    </Link>
                    <Button
                      variant="default"
                      size="sm"
                      disabled={status !== "active"}
                      loading={isVoting}
                      className="text-foreground dark:text-background shadow-none w-full"
                      onClick={handleOverrideVote}
                    >
                      {(() => {
                        console.log(
                          `Proposal ${proposal.key} - Vote exists: ${selectedVotes[proposal.key] !== undefined}, Local selection: ${localVoteSelection !== null}`,
                        );
                        // Only consider onchain votes for the button text
                        return selectedVotes[proposal.key] !== undefined
                          ? "Override Vote"
                          : "Vote";
                      })()}
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </>
          )}
        </div>
      </AccordionItem>
    );
  },
);
ProposalItem.displayName = "ProposalItem";

export default function VoteList() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedVotes, setSelectedVotes] = useState<Record<string, string>>(
    {},
  );
  const [isLoadingVotes, setIsLoadingVotes] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  const { glamClient } = useGlamClient();

  // Fetch proposals
  useEffect(() => {
    let mounted = true;

    const loadProposals = async () => {
      if (!mounted) return;

      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchProposals();

        if (mounted) {
          setProposals(data);
        }
      } catch (err) {
        if (mounted) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to load proposals";
          setError(errorMessage);
          console.error("Error loading proposals:", errorMessage);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadProposals();

    // Poll for new proposals every 8 hours
    const pollInterval = setInterval(loadProposals, 8 * 60 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  const activeProposals = useMemo(
    () =>
      proposals.filter(
        (proposal) =>
          getProposalStatus(
            proposal.activatedAt,
            proposal.votingEndsAt,
            proposal.canceledAt,
          ) === "active",
      ),
    [proposals],
  );

  // Fetch votes for active proposals
  useEffect(() => {
    const fetchVotes = async () => {
      if (!glamClient) return;
      const proposalKeys = activeProposals.map((proposal) => proposal.key);
      const fetchedVotes = await glamClient.fetchVotes(proposalKeys);

      console.log("Fetched onchain votes:", fetchedVotes);

      const votes = fetchedVotes.reduce(
        (acc, vote) => {
          acc[vote.proposal.toBase58()] = vote.side.toString();
          return acc;
        },
        {} as Record<string, string>,
      );

      console.log("Processed votes:", votes);
      setSelectedVotes(votes);
    };

    fetchVotes();
  }, [activeProposals, glamClient]);

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <Card className="select-none text-card-foreground p-0 sm:p-4 rounded border-muted">
        <div className="p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-xl mb-1">Proposals</CardTitle>
            <CardDescription>
              For full details visit the{" "}
              <Link
                href="https://vote.jup.ag/"
                target="_blank"
                className="underline hover:text-primary"
              >
                Jupiter Voting Platform
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px] rounded w-full">
              <div className="pb-20">
                {isLoading ? (
                  <div className="h-full w-full flex flex-row items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                    <p className="text-muted-foreground">
                      Loading proposals...
                    </p>
                  </div>
                ) : error ? (
                  <div className="h-full w-full flex flex-col items-center justify-center py-8">
                    <p className="text-destructive">{error}</p>
                  </div>
                ) : proposals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No active or inactive proposals.
                  </p>
                ) : (
                  <Accordion
                    type="single"
                    collapsible
                    className="space-y-2 w-full"
                  >
                    {proposals.map((proposal) => (
                      <ProposalItem
                        key={proposal.key}
                        proposal={proposal}
                        selectedVotes={selectedVotes}
                        onVoteChange={(key, value) => {
                          // Don't update selectedVotes here, as it should only contain onchain votes
                          // The local selection is managed within the ProposalItem component
                        }}
                      />
                    ))}
                  </Accordion>
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent pointer-events-none" />
            </ScrollArea>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}

import React, { Dispatch, SetStateAction } from "react";
import {
  DoubleArrowDownIcon,
  DoubleArrowRightIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CustomTree, { TreeNodeData } from "@/components/CustomTree";

interface ToolbarTreeProps {
  treeData: TreeNodeData;
  setTreeData: Dispatch<SetStateAction<TreeNodeData>>;
  isExpanded: boolean;
  toggleExpandCollapse: () => void;
  onCheckedItemsChange: (checkedItems: Record<string, boolean>) => void;
}

const ToolbarTree: React.FC<ToolbarTreeProps> = ({
  treeData,
  setTreeData,
  isExpanded,
  toggleExpandCollapse,
  onCheckedItemsChange,
}) => {
  return (
    <div className="w-full">
      {/*<div className="w-full">*/}
      {/*  <form className="w-full">*/}
      {/*    <div className="relative">*/}
      {/*      <MagnifyingGlassIcon className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />*/}
      {/*      <Input placeholder="Search" className="pl-8" />*/}
      {/*    </div>*/}
      {/*  </form>*/}
      {/*</div>*/}
      {/*<div className="flex flex-col pt-[38px]">*/}
      {/*duplicate; remove row when enabling search bar*/}
      <div className="flex flex-col">
        <div className="flex">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  className="mr-4"
                  variant="outline"
                  size="icon"
                  onClick={toggleExpandCollapse}
                >
                  {isExpanded ? (
                    <DoubleArrowDownIcon className="w-4 h-4" />
                  ) : (
                    <DoubleArrowRightIcon className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{isExpanded ? "Collapse All" : "Expand All"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CustomTree
          treeData={treeData}
          setTreeData={setTreeData}
          onCheckedItemsChange={onCheckedItemsChange}
          isExpanded={isExpanded}
        />
      </div>
    </div>
  );
};

export default ToolbarTree;

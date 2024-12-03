import React, {
  useState,
  useCallback,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { Checkbox } from "@/components/ui/checkbox";

export interface TreeNodeData {
  id: string;
  label: string;
  description?: string; // Added description field
  checked?: boolean;
  indeterminate?: boolean;
  collapsed?: boolean;
  icon?: React.ReactNode;
  children?: TreeNodeData[];
}

interface TreeNodeProps {
  node: TreeNodeData;
  level: number;
  onToggle: (nodeId: string) => void;
  onCheck: (nodeId: string, checked: boolean) => void;
  expandedNodes: Set<string>;
  setTreeData: React.Dispatch<React.SetStateAction<TreeNodeData>>;
  updateTree: (
    node: TreeNodeData,
    nodeId: string,
    checked: boolean
  ) => TreeNodeData;
}

const updateTree = (
  node: TreeNodeData,
  nodeId: string,
  checked: boolean
): TreeNodeData => {
  if (node.id === nodeId) {
    const updateChildren = (
      children: TreeNodeData[] | undefined
    ): TreeNodeData[] | undefined => {
      return children?.map((child) => ({
        ...child,
        checked,
        indeterminate: false,
        children: updateChildren(child.children),
      }));
    };

    return {
      ...node,
      checked,
      indeterminate: false,
      children: updateChildren(node.children),
    };
  }

  if (node.children) {
    const updatedChildren = node.children.map((child) =>
      updateTree(child, nodeId, checked)
    );
    const allChecked = updatedChildren.every((child) => child.checked);
    const someChecked = updatedChildren.some(
      (child) => child.checked || child.indeterminate
    );

    return {
      ...node,
      checked: allChecked,
      indeterminate: !allChecked && someChecked,
      children: updatedChildren,
    };
  }

  return node;
};

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  onToggle,
  onCheck,
  expandedNodes,
  setTreeData,
  updateTree,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);

  const handleToggle = useCallback(() => {
    onToggle(node.id);
  }, [onToggle, node.id]);

  const handleCheck = useCallback(
    (checked: boolean) => {
      onCheck(node.id, checked);
    },
    [onCheck, node.id]
  );

  const getIcon = () => {
    if (node.icon) {
      return node.icon;
    }
    if (hasChildren) {
      return isExpanded ? (
        <ChevronDownIcon className="w-4 h-4" />
      ) : (
        <ChevronRightIcon className="w-4 h-4" />
      );
    }
    return null;
  };

  const checkedState: boolean | "indeterminate" = node.indeterminate
    ? "indeterminate"
    : !!node.checked;

  let labelClass = "text-sm";
  if (hasChildren) {
    if (level === 1) {
      labelClass = "text-lg font-medium mt-0.5";
    } else if (level === 2) {
      labelClass = "text-base font-medium";
    } else if (level === 3) {
      labelClass = "text-sm font-medium";
    }
  }

  return (
    <div key={node.id} className="select-none">
      <div
        className="flex items-center py-1 px-2 cursor-pointer border-b transition-colors hover:bg-muted/50 opacity-75 hover:opacity-100"
        style={{ paddingLeft: `${level * 20 + 4}px` }}
      >
        <span
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          className={`mr-1 ${hasChildren ? "cursor-pointer" : ""}`}
        >
          {getIcon()}
        </span>
        <Checkbox
          checked={checkedState}
          onCheckedChange={(checked) => handleCheck(checked === true)}
          className="mr-2"
        />
        <span className={labelClass}>{node.label}</span>
        {node.description && (
          <div className="ml-4 text-muted-foreground text-xs">
            {node.description}
          </div>
        )}
      </div>
      {isExpanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onToggle={onToggle}
              onCheck={onCheck}
              expandedNodes={expandedNodes}
              setTreeData={setTreeData}
              updateTree={updateTree}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface UseExpandedNodesProps {
  data: TreeNodeData;
}

const useExpandedNodes = ({ data }: UseExpandedNodesProps) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const initialExpanded = new Set<string>();

    const initializeExpanded = (node: TreeNodeData) => {
      if (node.collapsed === false) {
        initialExpanded.add(node.id);
      }
      if (node.children && node.children.length > 0) {
        node.children.forEach(initializeExpanded);
      }
    };

    initializeExpanded(data);
    return initialExpanded;
  });

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((prevExpanded) => {
      const newExpanded = new Set(prevExpanded);
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId);
      } else {
        newExpanded.add(nodeId);
      }
      return newExpanded;
    });
  }, []);

  const expandAllNodes = useCallback(() => {
    const expandNodes = (node: TreeNodeData, expanded: Set<string>) => {
      expanded.add(node.id);
      if (node.children) {
        node.children.forEach((child) => expandNodes(child, expanded));
      }
    };

    const expanded = new Set<string>();
    expandNodes(data, expanded);
    setExpandedNodes(expanded);
  }, [data]);

  const collapseAllNodes = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  return {
    expandedNodes,
    setExpandedNodes,
    toggleNode,
    expandAllNodes,
    collapseAllNodes,
  };
};

interface CustomTreeProps {
  treeData: TreeNodeData;
  setTreeData: Dispatch<SetStateAction<TreeNodeData>>;
  onCheckedItemsChange?: (checkedItems: Record<string, boolean>) => void;
  isExpanded?: boolean;
}

const CustomTree: React.FC<CustomTreeProps> = ({
  treeData,
  setTreeData,
  onCheckedItemsChange,
  isExpanded,
}) => {
  const {
    expandedNodes,
    setExpandedNodes,
    toggleNode,
    expandAllNodes,
    collapseAllNodes,
  } = useExpandedNodes({ data: treeData });

  const handleCheck = useCallback(
    (nodeId: string, checked: boolean) => {
      setTreeData((prevData) => updateTree(prevData, nodeId, checked));
    },
    [setTreeData]
  );

  useEffect(() => {
    const getCheckedItems = (node: TreeNodeData): Record<string, boolean> => {
      let checkedItems: Record<string, boolean> = {};
      if (node.checked) {
        checkedItems[node.id] = true;
      }
      if (node.children) {
        node.children.forEach((child) => {
          checkedItems = { ...checkedItems, ...getCheckedItems(child) };
        });
      }
      return checkedItems;
    };

    const checkedItems = getCheckedItems(treeData);
    onCheckedItemsChange?.(checkedItems);
  }, [treeData, onCheckedItemsChange]);

  useEffect(() => {
    if (isExpanded !== undefined) {
      if (isExpanded) {
        expandAllNodes();
      } else {
        collapseAllNodes();
      }
    }
  }, [isExpanded, expandAllNodes, collapseAllNodes]);

  return (
    <div className="ml-5 border-l">
      <TreeNode
        node={treeData}
        level={0}
        onToggle={toggleNode}
        onCheck={handleCheck}
        expandedNodes={expandedNodes}
        setTreeData={setTreeData}
        updateTree={updateTree}
      />
    </div>
  );
};

export default CustomTree;

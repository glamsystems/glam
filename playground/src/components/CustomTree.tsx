import React, { useState, useCallback, useEffect } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileIcon,
  FileTextIcon,
} from '@radix-ui/react-icons';
import { Checkbox } from '@/components/ui/checkbox';

export interface TreeNodeData {
  id: string;
  label: string;
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
  updateTree: (node: TreeNodeData, nodeId: string, checked: boolean) => TreeNodeData;
}

const updateTree = (node: TreeNodeData, nodeId: string, checked: boolean): TreeNodeData => {
  if (node.id === nodeId) {
    const updateChildren = (
      children: TreeNodeData[] | undefined,
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
      updateTree(child, nodeId, checked),
    );
    const allChecked = updatedChildren.every((child) => child.checked);
    const someChecked = updatedChildren.some(
      (child) => child.checked || child.indeterminate,
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

const TreeNode: React.FC<TreeNodeProps> = React.memo(({
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

  console.log(`Rendering node "${node.id}". Is expanded: ${isExpanded}`); // Debugging log

  const handleToggle = useCallback(() => {
    onToggle(node.id);
  }, [onToggle, node.id]);

  const handleCheck = useCallback(
    (nodeId: string, checked: boolean) => {
      setTreeData((prevData) => updateTree(prevData, nodeId, checked));
    },
    [setTreeData, updateTree],
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
    return node.children ? (
      <FileTextIcon className="w-4 h-4" />
    ) : (
      <FileIcon className="w-4 h-4" />
    );
  };

  const checkedState: boolean | "indeterminate" = node.indeterminate
    ? "indeterminate"
    : !!node.checked;

  return (
    <div className="select-none">
      <div
        className="flex items-center py-1 px-2"
        style={{ paddingLeft: `${level * 20 + 4}px` }}
      >
        <span
          onClick={handleToggle}
          className={`mr-1 ${hasChildren ? "cursor-pointer" : ""}`}
        >
          {getIcon()}
        </span>
        <Checkbox
          checked={checkedState}
          onCheckedChange={(checked: boolean | "indeterminate") =>
            handleCheck(node.id, checked === true)
          }
          className="mr-2"
        />
        <span className="text-sm">{node.label}</span>
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
});

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

  return { expandedNodes, setExpandedNodes, toggleNode, expandAllNodes, collapseAllNodes };
};

interface CustomTreeProps {
  data: TreeNodeData;
  onCheckedItemsChange?: (checkedItems: Record<string, boolean>) => void;
  isExpanded?: boolean;
}

const CustomTree: React.FC<CustomTreeProps> = ({
                                                 data,
                                                 onCheckedItemsChange,
                                                 isExpanded,
                                               }) => {
  const { expandedNodes, setExpandedNodes, toggleNode, expandAllNodes, collapseAllNodes } = useExpandedNodes({ data });
  const [treeData, setTreeData] = useState<TreeNodeData>(data);

  const handleCheck = useCallback((nodeId: string, checked: boolean) => {
    setTreeData((prevData) => updateTree(prevData, nodeId, checked));
  }, []);

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
    <div className="p-4">
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

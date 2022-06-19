import { List } from "@raycast/api";
import { useState } from "react";
import { DDProps, TaskList } from "../interfaces";

export function ListDropdown(props: DDProps) {
  const [allLists] = useState<TaskList[]>(props.lists);
  // const [chosenList, setChosenList] = useState<string>(props.chosenList ? props.chosenList : props.lists[0].id);
  console.log("render dropdown!")
  return (
    <List.Dropdown
      tooltip="Select list"
      defaultValue={props.chosenList ? props.chosenList : props.lists[0].id}
      storeValue={true}
      onChange={(listId) => {
        props.chooseList(listId);
        props.filterTasks(listId);
        // setChosenList(listId);
      }}
    >
      {allLists.map(list => (
        <List.Dropdown.Item
          key={list.id}
          title={list.title}
          value={list.id}
        />
      ))}
    </List.Dropdown>
  );
}

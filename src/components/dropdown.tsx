import { List } from "@raycast/api";
import { DDProps } from "../interfaces";

export function ListDropdown(props: DDProps) {

  console.log("render dropdown!")
  return (
    <List.Dropdown
      tooltip="Select list"
      defaultValue={props.chosenList ? props.chosenList : props?.lists[0]?.id || ""}
      storeValue={true}
      onChange={(listId) => {
        props.chooseList(listId);
        props.filterTasks(listId);
      }}
    >
      {props.lists.map(list => (
        <List.Dropdown.Item
          key={list.id}
          title={list.title}
          value={list.id}
        />
      ))}
    </List.Dropdown>
  );
}

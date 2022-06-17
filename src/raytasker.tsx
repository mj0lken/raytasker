
import { List, Detail, Toast, showToast, Icon, ActionPanel, Action, Color } from "@raycast/api";
import { useState, useEffect } from "react";
import * as google from "./oauth/google";
import { Task, TaskList } from "./oauth/google";

interface DDProps {
  lists: TaskList[];
}

export default function Command() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [allTaskLists, setAllTaskLists] = useState<TaskList[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  showToast({ title: `Fetched ${allTasks.length} tasks in ${allTaskLists.length} lists` ?? "No tasks", style: Toast.Style.Success });

  useEffect(() => {

    async function getTask(list: TaskList[]): Promise<Task[]> {
      const allTasks = list.flatMap(async list => {
        return await google.fetchTasks(list.id)
      })
      return (await Promise.all(allTasks)).flat()
    }

    (async () => {
      try {
        await google.authorize()
        await google.fetchLists()
          .then(async list => {
            setAllTaskLists(list)

            console.log("list 0: ", list[0])
            // console.log("list.length: ", list.length)
            console.log(allTaskLists.length)
            // console.log("====")
            const tasks = await getTask(list)
            console.log('task 1', tasks[1])
            setAllTasks(tasks)
            setFilteredTasks(tasks)
            console.log(allTasks.length)
          })
        setIsLoading(false)
      } catch (error) {
        console.error(error)
        setIsLoading(false)
        showToast({ style: Toast.Style.Failure, title: String(error) })
      }
    })();
  }, [google, isLoading]);

  if (isLoading) {
    return <Detail isLoading={isLoading} />;
  }

  function getIcon(task: Task): any {
    // if(false) {
    // return Icon.ExclamationMark  
    // }
    return Icon.Circle
  }

  function ListDropdown(props: DDProps) {
    const { lists = [] as TaskList[] } = props;

    return (
      <List.Dropdown
        tooltip="Select list"
        storeValue={true}
        onChange={(filteredListId) => {
          filterTasks(filteredListId);
        }}
      >
        {/* <List.Dropdown.Section title="Task Lists"> */}
        {lists.map(list => (
          <List.Dropdown.Item
            key={list.id}
            title={list.title}
            value={list.id}
          />
        ))}
        {/* </List.Dropdown.Section> */}
      </List.Dropdown>
    );
  }
  function filterTasks(listId: string) {
    const fTasks = allTasks.filter(task => task.list == listId)
    setFilteredTasks(fTasks)
  }

  return (
    <List isLoading={isLoading}
      isShowingDetail searchBarAccessory={<ListDropdown lists={allTaskLists} />}>

      {filteredTasks.map(task => (
        <List.Item key={task.id} title={task.title}
          icon={{ source: Icon.Circle, tintColor: Color.Magenta }}
          subtitle={"List Name"}
          // detail={
          //   <List.Item.Detail
          //     // markdown={JSON.stringify(task)}
          //     metadata={
          //       <List.Item.Detail.Metadata>
          //         <List.Item.Detail.Metadata.Label title="Title" text={task.title} />
          //         <List.Item.Detail.Metadata.Label title="Height" text="70cm" />
          //         <List.Item.Detail.Metadata.Separator />
          //         <List.Item.Detail.Metadata.Label
          //           title="Due"
          //           icon={Icon.Calendar}
          //           text={task.title}
          //         />
          //       </List.Item.Detail.Metadata>
          //     }
          //   />
          // }
          actions={
            <ActionPanel>
              <Action
                icon={{ source: Icon.Checkmark, tintColor: Color.Blue }}
                title="Complete"
                shortcut={{ modifiers: ["cmd"], key: "enter" }}
                onAction={() => showToast({ style: Toast.Style.Success, title: "Task completed!" })}
              />
              <Action
                icon={{ source: Icon.Trash, tintColor: Color.Red }}
                title="Delete"
                shortcut={{ modifiers: ["cmd"], key: "backspace" }}
                onAction={() => showToast({ style: Toast.Style.Success, title: "Task deleted!" })}
              />
            </ActionPanel>
          }
        />
      ))
      }

    </List >
  )
}

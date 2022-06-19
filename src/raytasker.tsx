
import { List, Detail, Toast, showToast, Icon, ActionPanel, Action, Color, useNavigation, Form, Alert, confirmAlert } from "@raycast/api";
import { useState, useEffect } from "react";
import { ListDropdown } from "./components/dropdown";
import * as google from "./oauth/google";
import { Task, TaskList } from "./interfaces";
import { EditTaskForm } from "./components/form";

export default function Command() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [allTaskLists, setAllTaskLists] = useState<TaskList[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [chosenList, setChosenList] = useState<string>("");
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  // const [subTasks, setSubTasks] = useState<Task[]>([]);

  const { push } = useNavigation();

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
            setChosenList(list[0].id)
            const tasks = await getTask(list)
            setAllTasks(tasks)
            filterTasks(chosenList)
          })
          console.log("effect!")
          setIsLoading(false)
        } catch (error) {
          console.error(error)
          setIsLoading(false)
          showToast({ style: Toast.Style.Failure, title: String(error) })
        }
      })();
    }, [google]);
    console.log("render!")
    

  function getDayOfWeek(day: number) {
    console.log(day)
  }

  async function sendAlert(title: string, message: string, primaryTitle = "OK",): Promise<boolean> {
    const options: Alert.Options = {
      title,
      message,
      primaryAction: {
        title: primaryTitle,
        style: Alert.ActionStyle.Destructive,
        onAction: () => { },
      },
    };
    return await confirmAlert(options);
  };


  if (isLoading) {
    return <Detail isLoading={isLoading} />;
  }

  function getIcon(task: Task): any {
    if (new Date(task.due).getTime() < new Date().getTime()) {
      return { source: Icon.ExclamationMark, tintColor: Color.Orange }
    }
    return { source: Icon.Circle, tintColor: Color.PrimaryText }
  }

  function filterTasks(listId: string) {
    setChosenList(listId)
    const newTasks = allTasks
      .filter(task => !task.parent && (task.list == listId))
    // TODO sort on due date
    // .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())
    setFilteredTasks(newTasks)
  }

  function removeTask(taskId: string) {
    const newTasks = allTasks.filter(task => !(task.id == taskId))
    // TODO sort on due date
    setAllTasks(newTasks)
  }
  function addTask(task: Task) {
    const newTasks = allTasks
    newTasks.push(task)
    // TODO sort on due date
    setAllTasks(newTasks)
    filterTasks(chosenList)
  }

  function filterSubTasks() {
    // TODO: Filter out sub tasks
  }

  function getTimeRemaining(task: Task) {
    //sort on due
    return new Date(task.due).toLocaleDateString()
  }

  function sortNotes(note: string) {
    // TODO: 
  }

  return (
    <List isLoading={isLoading}
      isShowingDetail
      searchBarAccessory={
      <ListDropdown chooseList={setChosenList} 
      lists={allTaskLists} 
      filterTasks={filterTasks} 
      chosenList={chosenList} />}>

      {filteredTasks.map(task => (
        <List.Item key={task.id} title={task.title}
          icon={getIcon(task)}
          subtitle={task.due ? getTimeRemaining(task) : ""}
          detail={
            <List.Item.Detail
              markdown={task.notes}
              metadata={
                <List.Item.Detail.Metadata>
                  <List.Item.Detail.Metadata.Label
                    title="Title"
                    text={task.title}
                    icon={Icon.Dot}
                  />
                  <List.Item.Detail.Metadata.Separator />
                  <List.Item.Detail.Metadata.Label
                    title="Due"
                    icon={Icon.Calendar}
                    text={task.due ? new Date(task.due).toLocaleDateString() : "-"}
                  />
                </List.Item.Detail.Metadata>
              }
            />
          }
          actions={
            <ActionPanel>
              <Action
                icon={{ source: Icon.Checkmark, tintColor: Color.PrimaryText }}
                title="Mark complete"
                shortcut={{ modifiers: ["cmd"], key: "enter" }}
                onAction={() => showToast({ style: Toast.Style.Success, title: "Task completed!" })}
              />
              <Action
                icon={{ source: Icon.Trash, tintColor: Color.Red }}
                title="Delete"
                shortcut={{ modifiers: ["cmd"], key: "backspace" }}
                onAction={async () => {
                  if (await sendAlert("Delete the task?", "You will not be able torecover it", "Delete")) {
                    setIsLoading(true)
                    const res = await google.deleteTask(task.list, task.id)
                    if (res.status = 204) {
                      showToast({ style: Toast.Style.Success, title: "Deleted" })
                      removeTask(task.id)
                      filterTasks(task.list)
                    } else {
                      showToast({ style: Toast.Style.Failure, title: "Failed deleting" })
                    }
                  }
                  setIsLoading(false)
                }}
              />
              <Action
                icon={{ source: Icon.Pencil, tintColor: Color.PrimaryText }}
                title="Edit"
                shortcut={{ modifiers: ["cmd"], key: "e" }}
                onAction={() => {
                  push(<EditTaskForm task={task} currentList={chosenList} lists={allTaskLists}
                    createNew={false} filterTasks={filterTasks}
                    isLoading={setIsLoading} addTask={addTask} />)
                }}
              />
              <Action
                icon={{ source: Icon.Plus, tintColor: Color.PrimaryText }}
                title="Create Task"
                shortcut={{ modifiers: ["cmd"], key: "n" }}
                onAction={() => {
                  push(<EditTaskForm currentList={chosenList} lists={allTaskLists}
                    createNew={true} filterTasks={filterTasks}
                    isLoading={setIsLoading} addTask={addTask} />)
                }}
              />
            </ActionPanel>
          }
        />
        //End item above
      ))
      }

    </List >
  )
}

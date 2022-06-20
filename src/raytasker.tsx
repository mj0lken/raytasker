
import { Action, ActionPanel, Alert, Color, confirmAlert, Detail, Icon, List, showToast, Toast, useNavigation } from "@raycast/api"
import { useEffect, useState } from "react"
import { ListDropdown } from "./components/dropdown"
import { EditTaskForm } from "./components/form"
import { Task, TaskList } from "./interfaces"
import * as google from "./oauth/google"

export default function Command() {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [allTaskLists, setAllTaskLists] = useState<TaskList[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [chosenList, setChosenList] = useState<string>("")
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [render, setRender] = useState<number>(0)
  // const [subTasks, setSubTasks] = useState<Task[]>([])

  const { push } = useNavigation()
  console.log("pre!")

  // async function getTasks(list = allTaskLists): Promise<Task[]> {
  //   const tasks = list.flatMap(async list => {
  //     return await google.fetchTasks(list.id)
  //   })
  //   const aTasks = (await Promise.all(allTasks)).flat()
  //   setAllTasks(aTasks)
  //   if (chosenList) {
  //     filterTasks(chosenList)
  //   }
  //   return aTasks
  // }

  // async function getLists(): Promise<TaskList[]> {
  //   const lists = await google.fetchLists()
  //   setAllTaskLists(lists)
  //   if (!chosenList) {
  //     setChosenList(lists[0].id)
  //   }
  //   return lists
  // }

  useEffect(() => {
    (async () => {
      setIsLoading(true)
      async function getTasks(list = allTaskLists): Promise<Task[]> {
        const tasks = list.flatMap(async list => {
          return await google.fetchTasks(list.id)
        })
        const aTasks = (await Promise.all(allTasks)).flat()
        setAllTasks(aTasks)
        if (chosenList) {
          filterTasks(chosenList)
        }
        return aTasks
      }

      console.log("effect!")
      try {
        await google.authorize()
        await google.fetchLists()
          .then(async list => {
            setAllTaskLists(list)
            if (!chosenList) { setChosenList(list[0].id) }
            const tasks = await getTasks(list)
            setAllTasks(tasks)
            filterTasks(chosenList)
          })
        // setAllTaskLists(await getLists())
        // setAllTasks( await getTasks(allTaskLists))
        // if (!chosenList && allTaskLists[0]) {
        //   setChosenList(allTaskLists[0].id)
        // } else {
        //   filterTasks(chosenList)
        //   setIsLoading(false)
        // }
      } catch (error) {
        console.error(error)
        setIsLoading(false)
        showToast({ style: Toast.Style.Failure, title: String(error) })
      }
      setIsLoading(false)
    })()
  }, [google, allTasks])
  console.log("render!")

  // function getDayOfWeek(day: number) {
  //   console.log(day)
  // }

  async function sendAlert(title: string, message: string, primaryTitle = "OK",): Promise<boolean> {
    const options: Alert.Options = {
      title,
      message,
      primaryAction: {
        title: primaryTitle,
        style: Alert.ActionStyle.Destructive,
        onAction: () => { },
      },
    }
    return await confirmAlert(options)
  }

  function getIcon(task: Task): any {
    if (new Date(task.due).getTime() < new Date().getTime()) {
      return { source: Icon.ExclamationMark, tintColor: Color.Orange }
    }
    return { source: Icon.Circle, tintColor: Color.PrimaryText }
  }

  function filterTasks(listId: string) {
    if (chosenList !== listId) setChosenList(listId)
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
    filterTasks(chosenList)
  }

  function addTask(task: Task) {
    const newTasks = allTasks
    newTasks.push(task)
    // TODO sort on due date
    setAllTasks(newTasks)
    filterTasks(chosenList)
  }

  function editTask(task: Task, ind: number) {
    const newTasks = allTasks
    newTasks[ind] = task
    // TODO sort on due date
    setAllTasks(newTasks)
    filterTasks(chosenList)
  }

  // function filterSubTasks() {
  //   // TODO: Filter out sub tasks
  // }

  function getTimeRemaining(task: Task) {
    //sort on due
    return new Date(task.due).toLocaleDateString()
  }

  // function sortNotes(note: string) {
  //   // TODO: 
  // }
  if (isLoading) {
    return <Detail isLoading={isLoading} />
  }

  return (
    <List isLoading={isLoading}
      isShowingDetail
      searchBarAccessory={
        <ListDropdown chooseList={() => setChosenList}
          lists={allTaskLists}
          filterTasks={() => filterTasks}
          chosenList={chosenList} />}>

      {filteredTasks.map((task, i) => (
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
                    setIsLoading(false)
                  }
                }}
              />
              <Action
                icon={{ source: Icon.Pencil, tintColor: Color.PrimaryText }}
                title="Edit"
                shortcut={{ modifiers: ["cmd"], key: "e" }}
                onAction={() => {
                  push(<EditTaskForm index={i} task={task} currentList={chosenList} lists={allTaskLists}
                    createNew={false} filterTasks={filterTasks}
                    isLoading={setIsLoading} addTask={addTask} editTask={editTask} />)
                }}
              />
              <Action
                icon={{ source: Icon.Plus, tintColor: Color.PrimaryText }}
                title="Create Task"
                shortcut={{ modifiers: ["cmd"], key: "n" }}
                onAction={() => {
                  push(<EditTaskForm index={i} currentList={chosenList} lists={allTaskLists}
                    createNew={true} filterTasks={filterTasks}
                    isLoading={setIsLoading} addTask={addTask} editTask={editTask} />)
                }}
              />
            </ActionPanel>
          }
        />
      ))
      }

    </List >
  )
}


import { List, Detail, Toast, showToast, Icon, ActionPanel, Action, Color, useNavigation, Form, Alert, confirmAlert } from "@raycast/api";
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
            const tasks = await getTask(list)
            setAllTasks(tasks)
            filterTasks(list[0].id)
          })
        setIsLoading(false)
      } catch (error) {
        console.error(error)
        setIsLoading(false)
        showToast({ style: Toast.Style.Failure, title: String(error) })
      }
    })();
  }, [google, isLoading]);

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

  function EditTaskForm(edit: { task: Task, lists: TaskList[], createNew: boolean }) {
    const { task, lists, createNew } = edit;
    const { pop } = useNavigation();

    return (
      <Form
        actions={
          <ActionPanel>
            <Action.SubmitForm
              title="Save"
              icon={{ source: Icon.Trash, tintColor: Color.Red }}
              shortcut={{ modifiers: ["cmd"], key: "enter" }}
              onSubmit={async (values) => {
                if (createNew) {
                  setIsLoading(true)
                  const res = await google.createTask(values.list, values)
                  if (res.status == 200) {
                    showToast({ title: `Task Created`, style: Toast.Style.Success })
                    addTask('funkar: ', await res.json())
                  } else {
                    showToast({ title: `Error: ${res.status}`, style: Toast.Style.Failure })
                  }
                  setIsLoading(false)
                  pop()
                } else {
                  if (task.list != values.list) {
                    setIsLoading(true)
                    const res = await google.moveTask(values.list, task.id)
                    if (res.status == 200) {
                      showToast({ title: `Task Created`, style: Toast.Style.Success })
                    } else {
                      showToast({ title: `Error: ${res.status}`, style: Toast.Style.Failure })
                    }
                    setIsLoading(false)
                  }
                  // TODO: Handle no changes
                  // TODO: Update changes
                  pop()
                }
              }}
            />
          </ActionPanel>
        }
      >
        <Form.TextField id="title" title="Title" defaultValue={task.title || undefined} />
        <Form.DatePicker
          id="due"
          title="Deadline"
          defaultValue={task.due ? new Date(task.due) : undefined}
        />
        <Form.Separator />
        <Form.TextArea id="notes" title="Description" defaultValue={task.notes || undefined} />
        <Form.Dropdown id="list" title="List" defaultValue={task.list}>
          {lists.map(list => <Form.Dropdown.Item value={list.id} key={list.id} title={list.title} icon={Icon.Dot} />)}
        </Form.Dropdown>
      </Form>
    );
  }

  if (isLoading) {
    return <Detail isLoading={isLoading} />;
  }

  function getIcon(task: Task): any {
    if (new Date(task.due).getTime() < new Date().getTime()) {
      return { source: Icon.ExclamationMark, tintColor: Color.Orange }
    }
    return { source: Icon.Circle, tintColor: Color.PrimaryText }
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
        {lists.map(list => (
          <List.Dropdown.Item
            key={list.id}
            title={list.title}
            value={list.id}
          />
        ))}
      </List.Dropdown>
    );
  }

  function filterTasks(listId: string) {
    const newTasks = allTasks
      .filter(task => !task.parent && (task.list == listId))
    // TODO sort on due date
    // .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())
    setFilteredTasks(newTasks)
  }

  function removeTasks(taskId: string) {
    const newTasks = allTasks.filter(task => !(task.id == taskId))
    // TODO sort on due date
    setAllTasks(newTasks)
  }
  function addTask(task: Task) {
    const newTasks = allTasks
    // const newFTasks = filteredTasks
    newTasks.push(task)
    // newFTasks.push(task)
    // TODO sort on due date
    setAllTasks(newTasks)
    // setFilteredTasks(newFTasks)
  }

  function filterSubTasks() {
    // TODO: Filter out sub tasks
  }

  function getTimeRemaining(task: Task) {
    //sort on due
    return new Date(task.due).toLocaleDateString()
  }

  function sortNotes(note: string) {
    console.log(note)
  }

  return (
    <List isLoading={isLoading}
      isShowingDetail
      searchBarAccessory={<ListDropdown lists={allTaskLists} />}>

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
                    console.log('deleting?')
                    const res = await google.deleteTask(task.list, task.id)
                    if (res.status = 204) {
                      showToast({ style: Toast.Style.Success, title: "Deleted" })
                      async function getTask(list: TaskList[]): Promise<Task[]> {
                        const allTasks = list.flatMap(async list => {
                          return await google.fetchTasks(list.id)
                        })
                        return (await Promise.all(allTasks)).flat()
                      }
                      // TODO: Remove from filtered List :)
                      removeTasks(task.id)
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
                onAction={() => { push(<EditTaskForm task={task} lists={allTaskLists} createNew={false} />) }}
              />
              <Action
                icon={{ source: Icon.Plus, tintColor: Color.PrimaryText }}
                title="Create Task"
                shortcut={{ modifiers: ["cmd"], key: "n" }}
                onAction={() => {
                  push(<EditTaskForm task={{} as Task} lists={allTaskLists} createNew={true} />)
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

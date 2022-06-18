
import { List, Detail, Toast, showToast, Icon, ActionPanel, Action, Color, useNavigation, Form } from "@raycast/api";
import { useState, useEffect } from "react";
import * as google from "./oauth/google";
import { Task, TaskList } from "./oauth/google";

interface DDProps {
  lists: TaskList[];
}

function getDayOfWeek(day: number) {
  console.log(day)
}

function EditTaskForm(edit: { task: Task, lists: TaskList[] }) {
  const { task, lists } = edit;
  const { pop } = useNavigation();

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Submit Edit"
            icon={{ source: Icon.Trash, tintColor: Color.Red }}
            shortcut={{ modifiers: ["cmd"], key: "enter" }}
            onSubmit={(values) => {
              console.log(values)

              showToast({ title: `Task updated`, style: Toast.Style.Success });
              //Editing: 1st move.
              //Editing: then save
              setTimeout(() => showToast({ title: `Task updated`, style: Toast.Style.Success }), 3000)

              pop();
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextField id="title" title="Title" defaultValue={task.title} />
      <Form.DatePicker
        id="due"
        title="Deadline"
        defaultValue={task.due ? new Date(task.due) : undefined}
      />
      <Form.Separator />
      <Form.TextArea id="notes" title="Description" defaultValue={task.notes} />
      <Form.Dropdown id="list" title="List" defaultValue={task.list}>
        {lists.map(list => <Form.Dropdown.Item value={list.id} key={list.id} title={list.title} icon={Icon.Dot} />)}
      </Form.Dropdown>
    </Form>
  );
}


export default function Command() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [allTaskLists, setAllTaskLists] = useState<TaskList[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [subTasks, setSubTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  const { push } = useNavigation();
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
    // TODO
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
    const fTasks = allTasks.filter(task => !task.parent && (task.list == listId))
    // TODO sort on due date
    setFilteredTasks(fTasks)
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
      // isShowingDetail
      searchBarAccessory={<ListDropdown lists={allTaskLists} />}>

      {filteredTasks.map(task => (
        // Insert item here!
        <List.Item key={task.id} title={task.title}
          icon={{ source: Icon.Circle, tintColor: Color.Magenta }}
          subtitle={task.due ? getTimeRemaining(task) : ""}
          // detail={
          //   <List.Item.Detail
          //     markdown={JSON.stringify(task)}
          //     metadata={
          //       <List.Item.Detail.Metadata>
          //         <List.Item.Detail.Metadata.Label title="Title" text={task.title} />
          //         <List.Item.Detail.Metadata.Separator />
          //         {/* <List.Item.Detail.Metadata.Link
          //   title="Link"
          //   target="https://www.pokemon.com/us/pokedex/pikachu"
          //   text="Pikachu Link"
          // /> */}

          //         {/* <List.Item.Detail.Metadata.TagList title="Type">
          //   <List.Item.Detail.Metadata.TagList.Item text="Electric" color={"#eed535"} />
          // </List.Item.Detail.Metadata.TagList> */}
          //         <List.Item.Detail.Metadata.Label
          //           title="Due"
          //           icon={Icon.Calendar}
          //           text={task.due ? new Date(task.due).toLocaleDateString() : "-"}
          //         />
          //         <List.Item.Detail.Metadata.Label title="Notes" text={task.title} />
          //       </List.Item.Detail.Metadata>
          //     }
          //   />
          // }
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
                onAction={() => showToast({ style: Toast.Style.Success, title: "Task deleted!" })}
              />
              <Action
                icon={{ source: Icon.Pencil, tintColor: Color.PrimaryText }}
                title="Edit"
                shortcut={{ modifiers: ["cmd"], key: "e" }}
                onAction={() => { push(<EditTaskForm task={task} lists={allTaskLists} />) }}
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

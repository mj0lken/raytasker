import { Action, ActionPanel, Color, Form, Icon, List, showToast, Toast, useNavigation } from "@raycast/api";
import { FormProps } from "../interfaces";
import * as google from "./../oauth/google";

  export function EditTaskForm(props: FormProps) {
    const { pop } = useNavigation();
    // const [allLists] = useState<TaskList[]>(props.lists);
    // const [chosenList, setChosenList] = useState<string>(props.chosenList ? props.chosenList : props.lists[0].id);
    console.log("render form!")
  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Save"
            icon={{ source: Icon.Trash, tintColor: Color.Red }}
            shortcut={{ modifiers: ["cmd"], key: "enter" }}
            onSubmit={async (values) => {
              if (props.createNew) {
                props.isLoading(true)
                const res = await google.createTask(values.list, values)
                if (res.status == 200) {
                  showToast({ title: `Task Created`, style: Toast.Style.Success })
                  props.addTask(await res.json())
                } else {
                  showToast({ title: `Error: ${res.status}`, style: Toast.Style.Failure })
                }
                props.isLoading(false)
                pop()
              } else {
                if (props.task && props.currentList != values.list) {
                  props.isLoading(true)
                  const res = await google.moveTask(values.list, props.task.id)
                  if (res.status == 200) {
                    showToast({ title: `Task Created`, style: Toast.Style.Success })
                  } else {
                    showToast({ title: `Error: ${res.status}`, style: Toast.Style.Failure })
                  }
                  props.isLoading(false)
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
      <Form.TextField id="title" title="Title" defaultValue={props?.task?.title || undefined} />
      <Form.DatePicker
        id="due"
        title="Deadline"
        defaultValue={props?.task?.due ? new Date(props.task.due) : undefined}
      />
      <Form.Separator />
      <Form.TextArea id="notes" title="Description" defaultValue={props?.task?.notes || undefined} />
      <Form.Dropdown id="list" title="List" defaultValue={props.currentList}>
        {props.lists.map(list => <Form.Dropdown.Item value={list.id} key={list.id} title={list.title} icon={Icon.Dot} />)}
      </Form.Dropdown>
    </Form>
  );
}

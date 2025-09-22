from datetime import datetime
from pathlib import Path, PosixPath
from typing import List, Optional

from src.models import FileContent, Project
from src.settings import settings


def get_all_project_ids() -> List[str]:
    data_path = settings.data_path
    return [
        item.name
        for item in data_path.iterdir()
        if item.is_dir() and not item.name.startswith(".")
    ]


def get_all_projects() -> List[Project]:
    data_path = settings.data_path
    projects = []

    for item in data_path.iterdir():
        if not item.is_dir() or item.name.startswith("."):
            continue

        project = get_project_object_from_path(item)
        projects.append(project)

    return projects


def get_single_project(project_id: str) -> Optional[Project]:
    data_path = settings.data_path
    project_path_item = next(
        item
        for item in data_path.iterdir()
        if item.is_dir() and item.name == project_id
    )
    if not project_path_item:
        raise ValueError(f"Project not found: {project_id}")
    return get_project_object_from_path(project_path_item)


def get_project_object_from_path(path_item: PosixPath) -> Project:
    if not path_item.is_dir():
        raise ValueError(
            f"Path {path_item.name} is not a directory, and can't be turned into a Project."
        )

    data_path = settings.data_path

    relative_path = str(path_item.relative_to(data_path))
    absolute_path = path_item.absolute()

    return Project(
        id=path_item.name,
        name=path_item.name,
        path=relative_path,
        file_names=get_project_file_names(absolute_path),
        created=datetime.fromtimestamp(path_item.stat().st_ctime),
        modified=datetime.fromtimestamp(path_item.stat().st_mtime),
    )


def create_project(name: str) -> Project:
    data_path = settings.data_path

    safe_name = "".join(c for c in name if c.isalnum() or c in (" ", "-", "_")).strip()
    if not safe_name:
        raise ValueError(f"Invalid project name: {name}")

    project_path = data_path / safe_name
    if project_path.exists():
        raise ValueError(f"Project with name already exists: {name}")

    project_path.mkdir(parents=True, exist_ok=True)

    welcome_file = project_path / "welcome.md"
    with open(welcome_file, "w", encoding="utf-8") as f:
        f.write(
            f"# {safe_name}\n\nWelcome to your new project!\n\nStart writing your notes here.\n"
        )

    project = Project(
        id=safe_name,
        name=safe_name,
        path=str(project_path.relative_to(data_path)),
        file_names=get_project_file_names(project_path),
        created=datetime.now(),
        modified=datetime.now(),
    )

    return project


def open_file_by_id(project_id: str, file_id: str) -> FileContent:
    project = get_single_project(project_id)
    data_path = settings.data_path
    file_path = data_path / project.path / f"{file_id}.md"

    return open_file(str(file_path.relative_to(data_path)))


def open_file(file_path: str) -> FileContent:
    data_path = settings.data_path

    full_path = Path(file_path)
    if not full_path.is_absolute():
        full_path = data_path / file_path

    try:
        full_path.resolve().relative_to(data_path.resolve())
    except ValueError:
        raise ValueError("File path is outside allowed directory")

    if not full_path.exists():
        raise FileNotFoundError(f"File does not exist: {file_path}")

    if not full_path.is_file():
        raise ValueError(f"Path is not a file: {file_path}")

    try:
        with open(full_path, "r", encoding="utf-8") as f:
            content = f.read()
    except UnicodeDecodeError:
        raise ValueError(f"Cannot read file (unsupported encoding): {file_path}")

    stat = full_path.stat()

    return FileContent(
        name=full_path.stem,
        path=str(full_path.relative_to(data_path)),
        content=content,
        modified=datetime.fromtimestamp(stat.st_mtime),
        size=stat.st_size,
    )


def save_file_by_id(project_id: str, file_id: str, content: str) -> bool:
    project = get_single_project(project_id)
    data_path = settings.data_path
    file_path = data_path / project.path / f"{file_id}.md"

    return save_file(str(file_path.relative_to(data_path)), content)


def save_file(file_path: str, content: str) -> bool:
    data_path = settings.data_path

    full_path = Path(file_path)
    if not full_path.is_absolute():
        full_path = data_path / file_path

    try:
        full_path.resolve().relative_to(data_path.resolve())
    except ValueError:
        raise ValueError("File path is outside allowed directory")

    full_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    except Exception:
        return False


def create_file(project_id: str, filename: str) -> FileContent:
    project = get_single_project(project_id)
    data_path = settings.data_path

    if not filename.endswith(".md"):
        filename += ".md"

    safe_filename = "".join(
        c for c in filename if c.isalnum() or c in (" ", "-", "_", ".")
    ).strip()
    if not safe_filename:
        raise ValueError(f"Invalid filename: {filename}")

    project_path = data_path / project.path
    file_path = project_path / safe_filename

    if file_path.exists():
        raise ValueError("File already exists")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(
            f"# {safe_filename.replace('.md', '').replace('-', ' ').replace('_', ' ').title()}\n\n"
        )

    stat = file_path.stat()

    return FileContent(
        name=file_path.stem,
        path=str(file_path.relative_to(data_path)),
        content=f"# {safe_filename.replace('.md', '').replace('-', ' ').replace('_', ' ').title()}\n\n",
        modified=datetime.fromtimestamp(stat.st_mtime),
        size=stat.st_size,
    )


def delete_file(project_id: str, file_id: str) -> bool:
    project = get_single_project(project_id)
    data_path = settings.data_path
    file_path = data_path / project.path / f"{file_id}.md"

    if not file_path.exists():
        raise FileNotFoundError(f"File does not exist: {file_id}")

    try:
        file_path.resolve().relative_to(data_path.resolve())
    except ValueError:
        raise ValueError("File path is outside allowed directory")

    try:
        file_path.unlink()
        return True
    except Exception:
        return False


def rename_file(project_id: str, old_file_id: str, new_file_id: str) -> FileContent:
    project = get_single_project(project_id)
    data_path = settings.data_path
    project_path = data_path / project.path

    old_file_path = project_path / f"{old_file_id}.md"

    if not old_file_path.exists():
        raise FileNotFoundError(f"File does not exist: {old_file_id}")

    safe_new_filename = "".join(
        c for c in new_file_id if c.isalnum() or c in (" ", "-", "_")
    ).strip()
    if not safe_new_filename:
        raise ValueError(f"Invalid filename: {new_file_id}")

    new_file_path = project_path / f"{safe_new_filename}.md"

    if new_file_path.exists():
        raise ValueError(f"File already exists: {safe_new_filename}")

    try:
        old_file_path.rename(new_file_path)
    except Exception as e:
        raise ValueError(f"Failed to rename file: {str(e)}")

    stat = new_file_path.stat()

    with open(new_file_path, "r", encoding="utf-8") as f:
        content = f.read()

    return FileContent(
        name=new_file_path.stem,
        path=str(new_file_path.relative_to(data_path)),
        content=content,
        modified=datetime.fromtimestamp(stat.st_mtime),
        size=stat.st_size,
    )


def rename_project(project_id: str, new_name: str) -> Project:
    data_path = settings.data_path
    old_project_path = data_path / project_id

    if not old_project_path.exists():
        raise ValueError(f"Project not found: {project_id}")

    safe_new_name = "".join(
        c for c in new_name if c.isalnum() or c in (" ", "-", "_")
    ).strip()
    if not safe_new_name:
        raise ValueError(f"Invalid project name: {new_name}")

    new_project_path = data_path / safe_new_name

    if new_project_path.exists():
        raise ValueError(f"Project with name already exists: {safe_new_name}")

    try:
        old_project_path.rename(new_project_path)
    except Exception as e:
        raise ValueError(f"Failed to rename project: {str(e)}")

    return get_project_object_from_path(new_project_path)


def delete_project(project_id: str) -> bool:
    data_path = settings.data_path
    project_path = data_path / project_id

    if not project_path.exists():
        raise ValueError(f"Project not found: {project_id}")

    try:
        import shutil

        shutil.rmtree(project_path)
        return True
    except Exception:
        return False


def get_project_file_names(directory: Path) -> List[str]:
    file_names = []

    try:
        for item in directory.iterdir():
            if item.name.startswith("."):
                continue

            if not (item.is_file() and item.name.endswith(".md")):
                continue

            file_id = item.stem
            file_names.append(file_id)
    except PermissionError:
        pass

    return sorted(file_names)

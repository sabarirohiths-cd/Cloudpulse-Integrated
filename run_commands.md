# Developer Quick Start Commands

If you prefer to manually copy and paste the commands into your own terminal tabs inside the IDE, you can use the commands below.

### 1. Main Backend
Run this in terminal tab 1:
```powershell
cd d:\Cloudpulse-Integrated\Workspace-main\backend
.\venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

### 2. Main Frontend
Run this in terminal tab 2:
```powershell
cd d:\Cloudpulse-Integrated\Workspace-main\frontend
npm start
```

### 3. Topology Backend
Run this in terminal tab 3:
```powershell
cd d:\Cloudpulse-Integrated\Workspace-topology\backend
.\venv\Scripts\activate
uvicorn main:app --reload --port 8001
```

### 4. Topology Frontend
Run this in terminal tab 4:
```powershell
cd d:\Cloudpulse-Integrated\Workspace-topology\frontend
npm start -- --port 5174
```

*(Note: The `--` in the npm command is required to pass the port argument down to Vite).*

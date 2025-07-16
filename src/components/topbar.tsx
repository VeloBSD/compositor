function Topbar() {
    return (
        <>
            <div className="h-8 fixed text-xs w-full flex items-center justify-between px-4 z-20">
                <div className="items-center gap-2 hidden">
                    <div>
                        <b>Workspace</b>
                    </div>
                    <div className="border-r border-white h-4 opacity-40" />
                    <div className="flex items-center gap-3">
                        <span className="text-white font-bold">Velobsd Demo</span>
                        <span className="opacity-50">·</span>
                        <span className="text-white">File</span>
                        <span className="opacity-50">·</span>
                        <span className="text-white">Edit</span>
                        <span className="opacity-50">·</span>
                        <span className="text-white">Help</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-white font-bold">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                    </span>
                    <span className="text-white font-bold">
                        {new Date().toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </span>
                </div>
            </div>
        </>
    );
}

export default Topbar;
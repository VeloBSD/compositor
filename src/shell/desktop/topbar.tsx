// Regional configuration constants
const REGION_CONFIG = {
    locale: 'th-TH', // Thai locale for Thailand
    timezone: 'Asia/Bangkok',
    dateFormat: {
        weekday: 'short' as const,
        day: '2-digit' as const, 
        month: 'short' as const
    },
    timeFormat: {
        hour: '2-digit' as const,
        minute: '2-digit' as const,
        hour12: false // 24-hour format common in Thailand
    }
};

function Topbar() {
    const now = new Date();
    
    const currentTime = now.toLocaleTimeString(REGION_CONFIG.locale, {
        ...REGION_CONFIG.timeFormat,
        timeZone: REGION_CONFIG.timezone
    });
    
    const currentDate = now.toLocaleDateString(REGION_CONFIG.locale, {
        ...REGION_CONFIG.dateFormat,
        timeZone: REGION_CONFIG.timezone
    });

    return (
        <>
            <div className=" h-8 fixed text-xs w-screen flex items-center justify-between px-4 z-20 invert">
                <div className="items-center gap-2 flex">
                    <div>
                        <b>Workspace</b>
                    </div>
                    <div className="border-r border-black h-4 opacity-40" />
                    <div className="flex items-center gap-3">
                        <span className="text-black font-bold">Velobsd Demo</span>
                        <span className="opacity-50">·</span>
                        <span className="text-black">File</span>
                        <span className="opacity-50">·</span>
                        <span className="text-black">Edit</span>
                        <span className="opacity-50">·</span>
                        <span className="text-black">Help</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-black font-bold">
                        {currentTime}
                    </span>
                    <span className="text-black font-bold">
                        {currentDate}
                    </span>
                </div>
            </div>
        </>
    );
}

export default Topbar;
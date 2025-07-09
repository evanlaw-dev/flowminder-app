
function Header ({ topic, timer }: { topic: string; timer: string }) {
    return (
        <div className="w-[80%] text-white bg-stone-700/95 p-4 rounded-lg shadow-md items-center text-center">
            <div className="flex flex-col gap-1">
                <h2 className="text-sm">currently discussed: </h2>
                <h1 className="text-xl font-semibold">{topic}</h1>
                <div className="p-2 rounded-lg min-h-[2.5rem]">
                    <h1 className="text-2xl font-bold">{timer}</h1>
                </div>
            </div>
        </div>
    )
}

export default Header;
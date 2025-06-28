import Image from "next/image";


function Header () {
    return (
        <div className="flex flex-row items-center sm:items-start gap-4 bg-blue-50 p-4 rounded-lg">            
            <Image
                src="/wave.png"
                alt="Flowminder logo"
                width={180}
                height={180}
                priority 
            />
            <div className="flex flex-col gap-1 flex-1">
                <h2>currently discussed: </h2>
                <h1>(...)</h1>
                <div className="p-2 rounded-lg border focus:outline-none focus:ring-2 min-h-[2.5rem] border-gray-200 bg-white mt-1 items-center flex justify-center">
                    <p>TIMER</p>
                </div>
            </div>
        </div>
    )
}

export default Header;
// 참고: 현재 앱에서는 사용하지 않는 사이드바 목업 컴포넌트입니다.
// 디자인 가이드 보관용으로 남겨두었고, App.jsx에서는 렌더링하지 않습니다.
import React from 'react'

// 사이드바 기본 UI 제거 후, 제공해주신 Figma 스타일을 그대로 JSX로 반영
const SidebarFilters = () => {
  return (
    <aside className="fixed top-6 left-4 z-40">
      <div className="w-48 h-[830px] relative">
        <div className="w-48 h-[830px] left-0 top-0 absolute bg-stone-950/60 rounded-3xl shadow-[0px_48.70399856567383px_48.70399856567383px_-24.351999282836914px_rgba(41,15,0,0.56)] border-[0.38px] border-stone-400 backdrop-blur-3xl" />

        <div className="px-3 pt-5 pb-3 left-[18.26px] top-[604.99px] absolute bg-rose-950/10 rounded-3xl shadow-[0px_48.70399856567383px_48.70399856567383px_-24.351999282836914px_rgba(102,37,0,0.65)] outline outline-[0.38px] outline-offset-[-0.38px] outline-stone-400 inline-flex flex-col justify-start items-start gap-4">
          <div className="flex flex-col justify-start items-start gap-1">
            <div className="w-32 text-center justify-start text-white text-xs font-semibold leading-tight tracking-tight">Let's start!</div>
            <div className="w-32 text-center justify-start text-white/60 text-[9.89px] font-medium leading-none">Creating or adding new tasks couldn't be easier</div>
          </div>
          <div className="w-32 h-9 pl-4 pr-5 py-2 bg-orange-400 rounded-lg shadow-[0px_3.0439999103546143px_18.263999938964844px_0px_rgba(168,82,5,0.30)] inline-flex justify-center items-center gap-1">
            <div className="w-5 h-5 relative origin-top-left -rotate-180 rounded-2xl">
              <div className="w-2.5 h-2.5 left-[13.70px] top-[13.70px] absolute origin-top-left -rotate-180 outline outline-[1.22px] outline-offset-[-0.61px] outline-white" />
            </div>
            <div className="text-center justify-start text-white text-xs font-semibold leading-3">Add New Task</div>
          </div>
        </div>

        <div className="left-[18.26px] top-[418.55px] absolute inline-flex flex-col justify-start items-start gap-[3.04px]">
          <div className="self-stretch pl-4 pr-[3.04px] inline-flex justify-start items-center gap-3">
            <div className="flex-1 justify-center text-white/30 text-[8.37px] font-medium uppercase leading-tight tracking-tight">messages</div>
            <div className="w-5 h-5 relative origin-top-left -rotate-180 rounded-2xl">
              <div className="w-2.5 h-2.5 left-[13.70px] top-[13.70px] absolute origin-top-left -rotate-180 outline outline-1 outline-offset-[-0.53px] outline-white/30" />
            </div>
          </div>

          <div className="w-40 flex flex-col justify-start items-center">
            <div className="self-stretch px-4 py-3 relative rounded-lg outline outline-[0.76px] outline-offset-[-0.38px] inline-flex justify-start items-center gap-3">
              <div className="w-1 h-1 left-[28.92px] top-[25.87px] absolute bg-neutral-400 rounded-full" />
              <div className="w-5 h-5 relative bg-red-200 rounded-3xl overflow-hidden">
                <img className="w-5 h-5 left-0 top-0 absolute" src="https://placehold.co/18x18" />
              </div>
              <div className="flex-1 justify-start text-white/60 text-xs font-medium leading-none">Erik Gunsel</div>
            </div>
            <div className="self-stretch px-4 py-3 relative rounded-lg outline outline-[0.76px] outline-offset-[-0.38px] inline-flex justify-start items-center gap-3">
              <div className="w-1 h-1 left-[28.92px] top-[25.87px] absolute bg-stone-900 rounded-full outline outline-[0.76px] outline-offset-[-0.38px] outline-stone-400" />
              <div className="w-5 h-5 relative bg-orange-200 rounded-3xl overflow-hidden">
                <img className="w-5 h-5 left-0 top-0 absolute" src="https://placehold.co/18x18" />
              </div>
              <div className="flex-1 justify-start text-white/60 text-xs font-medium leading-none">Emily Smith</div>
            </div>
            <div className="self-stretch px-4 py-3 relative rounded-lg outline outline-[0.76px] outline-offset-[-0.38px] inline-flex justify-start items-center gap-3">
              <div className="w-1 h-1 left-[28.92px] top-[25.87px] absolute bg-neutral-400 rounded-full" />
              <div className="w-5 h-5 relative bg-pink-200 rounded-3xl overflow-hidden">
                <img className="w-5 h-5 left-0 top-0 absolute" src="https://placehold.co/18x18" />
              </div>
              <div className="flex-1 justify-start text-white/60 text-xs font-medium leading-none">Arthur Adelk</div>
            </div>
          </div>
        </div>

        <div className="w-48 h-[0.38px] left-0 top-[405.61px] absolute opacity-30 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,_#CC8B8B_0%,_rgba(163,59,59,0)_100%)]" />

        <div className="left-[18.26px] top-[111.87px] absolute inline-flex flex-col justify-start items-start gap-[3.04px]">
          <div className="self-stretch pl-4 pr-[3.04px] inline-flex justify-start items-center gap-3">
            <div className="flex-1 justify-center text-white/30 text-[8.37px] font-medium uppercase leading-tight tracking-tight">Main</div>
          </div>
          <div className="w-40 flex flex-col justify-start items-center">
            <div className="self-stretch px-4 py-3 relative bg-white/5 rounded-lg outline outline-[0.38px] outline-offset-[-0.19px] outline-stone-400 inline-flex justify-start items-center gap-3 overflow-hidden">
              <div className="w-5 h-5 relative shadow-[0px_0px_12.176px_0px_rgba(255,255,255,1)]" />
              <div className="flex-1 justify-start text-white text-xs font-medium leading-none [text-shadow:_0_0_12px_rgb(255_255_255/_1)]">Dashboard</div>
              <div className="w-5 h-5 relative origin-top-left -rotate-180 rounded-2xl">
                <div className="w-2.5 h-[5.17px] left-[4.57px] top-[6.09px] absolute bg-white/30" />
              </div>
            </div>
            <div className="self-stretch h-24 relative overflow-hidden">
              <div className="w-32 left-[35.01px] top-[2.28px] absolute inline-flex flex-col justify-start items-start gap-1.5">
                {['Activity','Trafic','Statistic'].map((t, i) => (
                  <div key={t} className={`self-stretch px-2.5 py-1.5 rounded ${i===2 ? 'bg-white/5 outline outline-[0.38px] outline-offset-[-0.38px] outline-stone-400' : 'outline outline-[0.76px] outline-offset-[-0.76px]'}`}>
                    <div className={`justify-center text-[9.13px] leading-none ${i===2 ? 'text-white' : 'text-white/60'} font-medium`}>{t}</div>
                  </div>
                ))}
              </div>
            </div>
            {['Invoices','Wallet','Notification'].map((t) => (
              <div key={t} className="self-stretch px-4 py-3 rounded-lg outline outline-[0.76px] outline-offset-[-0.38px] inline-flex justify-start items-center gap-3">
                <div className="w-5 h-5 relative overflow-hidden" />
                <div className="flex-1 justify-start text-white/60 text-xs font-medium leading-none [text-shadow:_0_0_12px_rgb(255_255_255/_1)]">{t}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-48 h-[0.38px] left-0 top-[98.93px] absolute opacity-30 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,_#CC8B8B_0%,_rgba(163,59,59,0)_100%)]" />
        <div className="w-5 h-5 left-[185.68px] top-[77.62px] absolute origin-top-left -rotate-90 bg-stone-950/40 rounded-2xl outline outline-[0.38px] outline-offset-[-0.38px] outline-stone-400 backdrop-blur-3xl">
          <div className="w-[5.17px] h-2.5 left-[6.09px] top-[4.57px] absolute opacity-80 bg-white/25" />
        </div>
        <div className="w-24 left-[63.98px] top-[51.75px] absolute justify-center text-white/30 text-[8.37px] font-medium uppercase leading-none tracking-tight">Product Designer</div>
        <div className="w-20 left-[63.98px] top-[68.49px] absolute justify-start text-white text-xs font-medium leading-none [text-shadow:_0_0_12px_rgb(255_255_255/_1)]">Andrew Smith</div>
        <div className="w-9 h-9 left-[18.26px] top-[50.23px] absolute bg-red-200 rounded-full" />
        <img className="w-9 h-9 left-[18.26px] top-[50.23px] absolute rounded-3xl" src="https://placehold.co/37x37" />
        <div className="w-2.5 h-2.5 left-[48.70px] top-[18.26px] absolute bg-lime-600" />
        <div className="w-2.5 h-2.5 left-[33.48px] top-[18.26px] absolute bg-amber-400" />
        <div className="w-2.5 h-2.5 left-[18.26px] top-[18.26px] absolute bg-red-500" />
      </div>
    </aside>
  )
}

export default SidebarFilters

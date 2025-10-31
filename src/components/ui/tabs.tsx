import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const listRef = React.useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = React.useState<{ left: number; width: number } | null>(null)

  const updateIndicator = React.useCallback(() => {
    if (!listRef.current) return

    const activeTab = listRef.current.querySelector<HTMLElement>('[data-state="active"]')
    if (!activeTab) {
      setIndicatorStyle(null)
      return
    }

    const listRect = listRef.current.getBoundingClientRect()
    const tabRect = activeTab.getBoundingClientRect()

    setIndicatorStyle({
      left: tabRect.left - listRect.left,
      width: tabRect.width,
    })
  }, [])

  React.useEffect(() => {
    updateIndicator()

    // Usar MutationObserver para detectar cambios en el estado de las pestañas
    const observer = new MutationObserver(() => {
      // Pequeño delay para asegurar que el DOM se haya actualizado
      setTimeout(updateIndicator, 0)
    })
    if (listRef.current) {
      observer.observe(listRef.current, {
        attributes: true,
        attributeFilter: ['data-state'],
        subtree: true,
        childList: true,
      })
    }

    // También escuchar cambios de tamaño de ventana
    window.addEventListener('resize', updateIndicator)

    // Intervalo de actualización como respaldo
    const interval = setInterval(updateIndicator, 100)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateIndicator)
      clearInterval(interval)
    }
  }, [updateIndicator])

  return (
    <TabsPrimitive.List
      ref={(node) => {
        listRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      }}
      className={cn(
        "inline-flex h-12 items-center justify-start border-b border-border text-muted-foreground relative min-w-full",
        className
      )}
      {...props}
    >
      {props.children}
      {indicatorStyle && (
        <span
          className="absolute bottom-0 h-[2px] bg-primary transition-all duration-300 ease-in-out"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />
      )}
    </TabsPrimitive.List>
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const [ripples, setRipples] = React.useState<Array<{ x: number; y: number; id: number; size: number }>>([])
  const rippleIdRef = React.useRef(0)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget
    const rect = button.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Calcular el tamaño máximo del ripple basado en la diagonal del botón
    const size = Math.max(rect.width, rect.height) * 2

    const id = rippleIdRef.current++
    setRipples((prev) => [...prev, { x, y, id, size }])

    // Remover el ripple después de la animación
    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id))
    }, 600)

    // Llamar al onClick original si existe
    if (props.onClick) {
      props.onClick(e)
    }
  }

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors relative min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-primary overflow-hidden",
        className
      )}
      {...props}
      onClick={handleClick}
    >
      <span className="relative z-10">{props.children}</span>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-primary/30 pointer-events-none z-0 animate-ripple"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: `${ripple.size}px`,
            height: `${ripple.size}px`,
          }}
        />
      ))}
    </TabsPrimitive.Trigger>
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
